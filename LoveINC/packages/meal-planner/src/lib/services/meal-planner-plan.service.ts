import { Injectable } from '@angular/core';
import type {
  CachedRecipe,
  GroceryItem,
  MealRecap,
  PlanMeal,
  WeeklyPlan,
  WeeklySummary,
} from '../types/meal-planner.types';
import type { MealRecapComplexity } from '../constants/meal-recap.constants';
import { MEALS_PER_WEEK } from '../constants/cook.constants';
import { getCurrentWeekStart } from '../utils/week-date.util';
import {
  formatScaledIngredientAmount,
  getRecipeScaleFactor,
  getTargetServings,
} from '../utils/recipe-scaling.util';
import {
  compareGroceryAisles,
  GROCERY_AISLE_ORDER,
  normalizeGroceryAisle,
} from '../utils/grocery-aisle.util';
import { resolveIngredientImageUrl } from '../utils/ingredient-image.util';
import { MealPlannerDatabaseService } from './meal-planner-database.service';
import { MealPlannerIngredientImageService } from './meal-planner-ingredient-image.service';
import { MealPlannerProfileService } from './meal-planner-profile.service';
import { MealPlannerRecipeService } from './meal-planner-recipe.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerPlanService {
  private groceryRebuildPromises = new Map<number, Promise<void>>();

  constructor(
    private dbService: MealPlannerDatabaseService,
    private ingredientImageService: MealPlannerIngredientImageService,
    private profileService: MealPlannerProfileService,
    private recipeService: MealPlannerRecipeService
  ) {}

  async getEarliestWeekStart(): Promise<string | null> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query(
      'SELECT week_start_date FROM weekly_plans ORDER BY week_start_date ASC LIMIT 1'
    );
    const row = result.values?.[0];
    return row ? String(row['week_start_date']) : null;
  }

  async getWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan | null> {
    const db = await this.dbService.getDbConnection();
    const planResult = await db.query('SELECT * FROM weekly_plans WHERE week_start_date = ?', [
      weekStartDate,
    ]);
    const planRow = planResult.values?.[0];
    if (!planRow) {
      return null;
    }

    const mealsResult = await db.query(
      'SELECT * FROM plan_meals WHERE weekly_plan_id = ? ORDER BY slot_index ASC',
      [planRow['id']]
    );
    const meals: PlanMeal[] = [];
    for (const mealRow of mealsResult.values ?? []) {
      const recipe = await this.recipeService.getCachedRecipeById(Number(mealRow['cached_recipe_id']));
      meals.push({
        id: Number(mealRow['id']),
        weeklyPlanId: Number(mealRow['weekly_plan_id']),
        cachedRecipeId: Number(mealRow['cached_recipe_id']),
        slotIndex: Number(mealRow['slot_index']),
        recipe: recipe ?? undefined,
        extraGuests: Number(mealRow['extra_guests']),
        eventNote: mealRow['event_note'] ? String(mealRow['event_note']) : undefined,
        isCooked: Boolean(mealRow['is_cooked']),
        cookTimeBucket: mealRow['cook_time_bucket'] ? String(mealRow['cook_time_bucket']) : undefined,
        reactionEmoji: mealRow['reaction_emoji'] ? String(mealRow['reaction_emoji']) : undefined,
        actualCookMinutes:
          mealRow['actual_cook_minutes'] != null ? Number(mealRow['actual_cook_minutes']) : undefined,
        complexity: mealRow['complexity']
          ? (String(mealRow['complexity']) as MealRecapComplexity)
          : undefined,
        cookedAt: mealRow['cooked_at'] ? String(mealRow['cooked_at']) : undefined,
      });
    }

    return {
      id: Number(planRow['id']),
      weekStartDate: String(planRow['week_start_date']),
      weekServingDelta: Number(planRow['week_serving_delta']),
      weekNote: planRow['week_note'] ? String(planRow['week_note']) : undefined,
      meals,
      createdAt: String(planRow['created_at']),
      updatedAt: String(planRow['updated_at']),
    };
  }

  async ensureWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan> {
    const existing = await this.getWeeklyPlan(weekStartDate);
    if (existing) {
      return existing;
    }
    const db = await this.dbService.getDbConnection();
    const now = new Date().toISOString();
    const insert = await db.run(
      `INSERT INTO weekly_plans (week_start_date, week_serving_delta, week_note, created_at, updated_at)
       VALUES (?, 0, NULL, ?, ?)`,
      [weekStartDate, now, now]
    );
    return {
      id: insert.changes?.lastId,
      weekStartDate,
      weekServingDelta: 0,
      meals: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateWeekAdjustments(
    weekStartDate: string,
    weekServingDelta: number,
    weekNote?: string
  ): Promise<WeeklyPlan> {
    const plan = await this.ensureWeeklyPlan(weekStartDate);
    const db = await this.dbService.getDbConnection();
    const updatedAt = new Date().toISOString();
    await db.run(
      'UPDATE weekly_plans SET week_serving_delta = ?, week_note = ?, updated_at = ? WHERE id = ?',
      [weekServingDelta, weekNote ?? null, updatedAt, plan.id]
    );
    const refreshed = await this.getWeeklyPlan(weekStartDate);
    if (refreshed) {
      await this.rebuildGroceryList(refreshed);
      return refreshed;
    }
    throw new Error('Failed to update weekly plan');
  }

  async setMealForSlot(
    weekStartDate: string,
    slotIndex: number,
    cachedRecipeId: number
  ): Promise<WeeklyPlan> {
    if (slotIndex < 0 || slotIndex >= MEALS_PER_WEEK) {
      throw new Error('Invalid meal slot');
    }
    const plan = await this.ensureWeeklyPlan(weekStartDate);
    const db = await this.dbService.getDbConnection();
    const now = new Date().toISOString();
    const existingMeal = plan.meals.find((m) => m.slotIndex === slotIndex);

    if (existingMeal?.id) {
      await db.run(
        `UPDATE plan_meals SET cached_recipe_id = ?, is_cooked = 0, cook_time_bucket = NULL,
         reaction_emoji = NULL, actual_cook_minutes = NULL, complexity = NULL, cooked_at = NULL WHERE id = ?`,
        [cachedRecipeId, existingMeal.id]
      );
    } else {
      await db.run(
        `INSERT INTO plan_meals
         (weekly_plan_id, cached_recipe_id, slot_index, extra_guests, is_cooked, created_at)
         VALUES (?, ?, ?, 0, 0, ?)`,
        [plan.id, cachedRecipeId, slotIndex, now]
      );
    }

    await db.run('UPDATE weekly_plans SET updated_at = ? WHERE id = ?', [now, plan.id]);
    const refreshed = await this.getWeeklyPlan(weekStartDate);
    if (!refreshed) {
      throw new Error('Failed to save meal');
    }
    await this.rebuildGroceryList(refreshed);
    return refreshed;
  }

  async clearMealForSlot(weekStartDate: string, slotIndex: number): Promise<WeeklyPlan> {
    if (slotIndex < 0 || slotIndex >= MEALS_PER_WEEK) {
      throw new Error('Invalid meal slot');
    }
    const plan = await this.getWeeklyPlan(weekStartDate);
    if (!plan?.id) {
      throw new Error('Weekly plan not found');
    }
    const existingMeal = plan.meals.find((meal) => meal.slotIndex === slotIndex);
    if (!existingMeal?.id) {
      return plan;
    }

    const db = await this.dbService.getDbConnection();
    const now = new Date().toISOString();
    await db.run('DELETE FROM plan_meals WHERE id = ?', [existingMeal.id]);
    await db.run('UPDATE weekly_plans SET updated_at = ? WHERE id = ?', [now, plan.id]);

    const refreshed = await this.getWeeklyPlan(weekStartDate);
    if (!refreshed) {
      throw new Error('Failed to clear meal');
    }
    await this.rebuildGroceryList(refreshed);
    return refreshed;
  }

  async saveMealRecap(planMealId: number, recap: MealRecap): Promise<void> {
    const db = await this.dbService.getDbConnection();
    const mealResult = await db.query('SELECT cooked_at FROM plan_meals WHERE id = ?', [planMealId]);
    const existingCookedAt = mealResult.values?.[0]?.['cooked_at'];
    const cookedAt = existingCookedAt ? String(existingCookedAt) : new Date().toISOString();

    await db.run(
      `UPDATE plan_meals
       SET is_cooked = 1,
           reaction_emoji = ?,
           actual_cook_minutes = ?,
           complexity = ?,
           cooked_at = ?
       WHERE id = ?`,
      [
        recap.reactionEmoji ?? null,
        recap.actualCookMinutes ?? null,
        recap.complexity ?? null,
        cookedAt,
        planMealId,
      ]
    );
  }

  async updateMealGuests(
    planMealId: number,
    extraGuests: number,
    eventNote?: string
  ): Promise<void> {
    const db = await this.dbService.getDbConnection();
    if (eventNote !== undefined) {
      await db.run('UPDATE plan_meals SET extra_guests = ?, event_note = ? WHERE id = ?', [
        extraGuests,
        eventNote,
        planMealId,
      ]);
    } else {
      await db.run('UPDATE plan_meals SET extra_guests = ? WHERE id = ?', [extraGuests, planMealId]);
    }
    const mealResult = await db.query('SELECT weekly_plan_id FROM plan_meals WHERE id = ?', [planMealId]);
    const weekPlanId = mealResult.values?.[0]?.['weekly_plan_id'];
    if (!weekPlanId) {
      return;
    }
    const planResult = await db.query('SELECT week_start_date FROM weekly_plans WHERE id = ?', [weekPlanId]);
    const weekStart = planResult.values?.[0]?.['week_start_date'];
    if (!weekStart) {
      return;
    }
    const plan = await this.getWeeklyPlan(String(weekStart));
    if (plan) {
      await this.rebuildGroceryList(plan);
    }
  }

  async refreshGroceryList(weekStartDate: string): Promise<void> {
    const plan = await this.getWeeklyPlan(weekStartDate);
    if (plan?.id && plan.meals.length > 0) {
      await this.rebuildGroceryList(plan);
    }
  }

  async getGroceryItems(weekStartDate: string): Promise<GroceryItem[]> {
    const plan = await this.getWeeklyPlan(weekStartDate);
    if (!plan?.id) {
      return [];
    }

    await this.awaitGroceryRebuild(plan.id);

    let items = await this.queryGroceryItems(plan.id);
    if (await this.groceryListNeedsRebuild(plan, items)) {
      await this.rebuildGroceryList(plan);
      await this.awaitGroceryRebuild(plan.id);
      items = await this.queryGroceryItems(plan.id);
    }
    return items;
  }

  private async awaitGroceryRebuild(weeklyPlanId: number): Promise<void> {
    const inFlight = this.groceryRebuildPromises.get(weeklyPlanId);
    if (inFlight) {
      await inFlight;
    }
  }

  private async queryGroceryItems(weeklyPlanId: number): Promise<GroceryItem[]> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query(
      'SELECT * FROM grocery_items WHERE weekly_plan_id = ? ORDER BY sort_order ASC, ingredient_name ASC',
      [weeklyPlanId]
    );
    return (result.values ?? []).map((row) => this.mapGroceryItemRow(row));
  }

  private mapGroceryItemRow(row: Record<string, unknown>): GroceryItem {
    return {
      id: Number(row['id']),
      weeklyPlanId: Number(row['weekly_plan_id']),
      aisle: String(row['aisle']),
      ingredientName: String(row['ingredient_name']),
      amountText: String(row['amount_text']),
      isChecked: Boolean(row['is_checked']),
      isManual: Boolean(row['is_manual']),
      imageUrl: row['image_url'] ? String(row['image_url']) : undefined,
      sortOrder: Number(row['sort_order']),
    };
  }

  async addGroceryItem(
    weekStartDate: string,
    ingredientName: string,
    imageUrl?: string
  ): Promise<GroceryItem> {
    const trimmed = ingredientName.trim();
    if (!trimmed) {
      throw new Error('Item name is required');
    }

    const plan = await this.ensureWeeklyPlan(weekStartDate);
    if (!plan.id) {
      throw new Error('Weekly plan not found');
    }

    const db = await this.dbService.getDbConnection();
    const aisle = normalizeGroceryAisle(undefined, trimmed);
    const displayName = this.titleCase(trimmed);
    const ingredientKey = this.buildGroceryIngredientKey(aisle, displayName);
    const cachedImage = imageUrl ?? (await this.ingredientImageService.getCachedImage(trimmed));

    const existing = await db.query(
      'SELECT ingredient_name FROM grocery_items WHERE weekly_plan_id = ?',
      [plan.id]
    );
    const duplicate = (existing.values ?? []).some(
      (row) => String(row['ingredient_name']).toLowerCase() === displayName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('That item is already on your list');
    }

    const sortResult = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM grocery_items WHERE weekly_plan_id = ?',
      [plan.id]
    );
    const sortOrder = Number(sortResult.values?.[0]?.['max_sort'] ?? -1) + 1;

    const insert = await db.run(
      `INSERT INTO grocery_items
       (weekly_plan_id, aisle, ingredient_name, amount_text, is_checked, sort_order, is_manual, image_url)
       VALUES (?, ?, ?, '', 0, ?, 1, ?)`,
      [plan.id, aisle, displayName, sortOrder, cachedImage ?? null]
    );

    await db.run(
      'DELETE FROM grocery_item_exclusions WHERE weekly_plan_id = ? AND ingredient_key = ?',
      [plan.id, ingredientKey]
    );

    if (cachedImage) {
      await this.ingredientImageService.cacheImage(trimmed, cachedImage);
    }

    const itemId = insert.changes?.lastId;
    if (!itemId) {
      throw new Error('Failed to add grocery item');
    }

    const row = await db.query('SELECT * FROM grocery_items WHERE id = ?', [itemId]);
    const created = row.values?.[0];
    if (!created) {
      throw new Error('Failed to load grocery item');
    }
    return this.mapGroceryItemRow(created);
  }

  async setGroceryItemImageUrl(itemId: number, imageUrl: string): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run('UPDATE grocery_items SET image_url = ? WHERE id = ?', [imageUrl, itemId]);
  }

  async removeGroceryItem(itemId: number): Promise<void> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query('SELECT * FROM grocery_items WHERE id = ?', [itemId]);
    const row = result.values?.[0];
    if (!row) {
      return;
    }

    const weeklyPlanId = Number(row['weekly_plan_id']);
    const aisle = String(row['aisle']);
    const ingredientName = String(row['ingredient_name']);
    const isManual = Boolean(row['is_manual']);

    if (!isManual) {
      const ingredientKey = this.buildGroceryIngredientKey(aisle, ingredientName);
      await db.run(
        `INSERT OR IGNORE INTO grocery_item_exclusions (weekly_plan_id, ingredient_key, created_at)
         VALUES (?, ?, ?)`,
        [weeklyPlanId, ingredientKey, new Date().toISOString()]
      );
    }

    await db.run('DELETE FROM grocery_items WHERE id = ?', [itemId]);
  }

  private async groceryListNeedsRebuild(plan: WeeklyPlan, items: GroceryItem[]): Promise<boolean> {
    if (plan.meals.length > 0 && !items.length) {
      return true;
    }
    if (!items.length) {
      return false;
    }
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.aisle}::${item.ingredientName.toLowerCase()}`;
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
    }
    const normalizedAisles = new Set<string>(GROCERY_AISLE_ORDER);
    if (items.some((item) => !normalizedAisles.has(item.aisle))) {
      return true;
    }
    if (items.some((item) => !item.imageUrl)) {
      for (const meal of plan.meals) {
        const recipe =
          meal.recipe ?? (await this.recipeService.getCachedRecipeById(meal.cachedRecipeId));
        if (recipe?.ingredients.some((ingredient) => resolveIngredientImageUrl(ingredient))) {
          return true;
        }
      }
    }
    return false;
  }

  async setGroceryItemChecked(itemId: number, checked: boolean): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run('UPDATE grocery_items SET is_checked = ? WHERE id = ?', [checked ? 1 : 0, itemId]);
  }

  async getWeeklySummary(weekStartDate: string): Promise<WeeklySummary> {
    const plan = await this.getWeeklyPlan(weekStartDate);
    const meals = plan?.meals ?? [];
    let readyTotal = 0;
    let readyCount = 0;

    for (const meal of meals) {
      if (meal.recipe?.readyInMinutes) {
        readyTotal += meal.recipe.readyInMinutes;
        readyCount += 1;
      }
    }

    return {
      weekStartDate,
      mealsPlanned: meals.length,
      averageReadyMinutes: readyCount ? Math.round(readyTotal / readyCount) : undefined,
    };
  }

  async getCurrentWeekPlan(): Promise<WeeklyPlan | null> {
    return this.getWeeklyPlan(getCurrentWeekStart());
  }

  private async rebuildGroceryList(plan: WeeklyPlan): Promise<void> {
    if (!plan.id) {
      return;
    }

    const planId = plan.id;
    const inFlight = this.groceryRebuildPromises.get(planId);
    if (inFlight) {
      await inFlight;
      return;
    }

    const rebuildPromise = this.performRebuildGroceryList(plan);
    this.groceryRebuildPromises.set(planId, rebuildPromise);
    try {
      await rebuildPromise;
    } finally {
      if (this.groceryRebuildPromises.get(planId) === rebuildPromise) {
        this.groceryRebuildPromises.delete(planId);
      }
    }
  }

  private async performRebuildGroceryList(plan: WeeklyPlan): Promise<void> {
    if (!plan.id) {
      return;
    }
    const profile = await this.profileService.getProfile();
    const householdSize = profile?.householdSize ?? 2;
    const db = await this.dbService.getDbConnection();
    const checkedByIngredient = new Map<string, boolean>();
    const existingItems = await db.query(
      'SELECT ingredient_name, is_checked FROM grocery_items WHERE weekly_plan_id = ?',
      [plan.id]
    );
    for (const row of existingItems.values ?? []) {
      const key = String(row['ingredient_name']).toLowerCase();
      const checked = Boolean(row['is_checked']);
      checkedByIngredient.set(key, checkedByIngredient.get(key) || checked);
    }

    const manualItemsResult = await db.query(
      'SELECT ingredient_name, aisle, image_url FROM grocery_items WHERE weekly_plan_id = ? AND is_manual = 1',
      [plan.id]
    );
    const savedManualItems = (manualItemsResult.values ?? []).map((row) => ({
      ingredientName: String(row['ingredient_name']),
      aisle: String(row['aisle']),
      imageUrl: row['image_url'] ? String(row['image_url']) : undefined,
    }));

    const exclusions = new Set<string>();
    const exclusionsResult = await db.query(
      'SELECT ingredient_key FROM grocery_item_exclusions WHERE weekly_plan_id = ?',
      [plan.id]
    );
    for (const row of exclusionsResult.values ?? []) {
      exclusions.add(String(row['ingredient_key']));
    }

    await db.run('DELETE FROM grocery_items WHERE weekly_plan_id = ?', [plan.id]);

    const merged = new Map<
      string,
      { aisle: string; amounts: string[]; imageUrl?: string; isManual: boolean }
    >();

    let activeExclusions = exclusions;
    await this.mergeRecipeIngredientsIntoGroceryMap(
      plan,
      householdSize,
      merged,
      activeExclusions
    );

    if (merged.size === 0 && plan.meals.length > 0 && activeExclusions.size > 0) {
      await db.run('DELETE FROM grocery_item_exclusions WHERE weekly_plan_id = ?', [plan.id]);
      activeExclusions = new Set();
      await this.mergeRecipeIngredientsIntoGroceryMap(
        plan,
        householdSize,
        merged,
        activeExclusions
      );
    }

    for (const manual of savedManualItems) {
      const key = this.buildGroceryIngredientKey(manual.aisle, manual.ingredientName);
      if (activeExclusions.has(key) || merged.has(key)) {
        continue;
      }
      merged.set(key, {
        aisle: manual.aisle,
        amounts: [''],
        imageUrl: manual.imageUrl,
        isManual: true,
      });
    }

    const aisleOrder = [...merged.values()]
      .map((v) => v.aisle)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort(compareGroceryAisles);

    let sortOrder = 0;
    for (const aisle of aisleOrder) {
      const items = [...merged.entries()]
        .filter(([, v]) => v.aisle === aisle)
        .sort((a, b) => a[0].localeCompare(b[0]));

      for (const [key, value] of items) {
        const ingredientName = key.split('::')[1] ?? key;
        const displayName = this.titleCase(ingredientName);
        const amountText = value.amounts.filter(Boolean).join(' + ');
        const isChecked = checkedByIngredient.get(displayName.toLowerCase()) ? 1 : 0;
        await db.run(
          `INSERT INTO grocery_items
           (weekly_plan_id, aisle, ingredient_name, amount_text, is_checked, sort_order, is_manual, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.id,
            aisle,
            displayName,
            amountText,
            isChecked,
            sortOrder++,
            value.isManual ? 1 : 0,
            value.imageUrl ?? null,
          ]
        );
        if (value.imageUrl) {
          void this.ingredientImageService.cacheImage(displayName, value.imageUrl).catch(() => {});
        }
      }
    }
  }

  private async mergeRecipeIngredientsIntoGroceryMap(
    plan: WeeklyPlan,
    householdSize: number,
    merged: Map<
      string,
      { aisle: string; amounts: string[]; imageUrl?: string; isManual: boolean }
    >,
    exclusions: Set<string>
  ): Promise<void> {
    for (const meal of plan.meals) {
      await this.mergeMealIngredientsIntoGroceryMap(
        meal,
        plan,
        householdSize,
        merged,
        exclusions
      );
    }
  }

  private async mergeMealIngredientsIntoGroceryMap(
    meal: PlanMeal,
    plan: WeeklyPlan,
    householdSize: number,
    merged: Map<
      string,
      { aisle: string; amounts: string[]; imageUrl?: string; isManual: boolean }
    >,
    exclusions: Set<string>
  ): Promise<void> {
    const recipe =
      meal.recipe ?? (await this.recipeService.getCachedRecipeById(meal.cachedRecipeId));
    if (!recipe) {
      return;
    }
    const targetServings = getTargetServings(
      householdSize,
      plan.weekServingDelta,
      meal.extraGuests
    );
    const scale = getRecipeScaleFactor(recipe.servings, targetServings);

    for (const ingredient of recipe.ingredients) {
      const normalizedAisle = normalizeGroceryAisle(
        ingredient.aisle,
        ingredient.name,
        ingredient.original
      );
      const key = this.buildGroceryIngredientKey(normalizedAisle, ingredient.name);
      if (exclusions.has(key)) {
        continue;
      }
      const scaledAmount = formatScaledIngredientAmount(ingredient, scale);
      let imageUrl: string | undefined;
        try {
          imageUrl =
            resolveIngredientImageUrl(ingredient) ??
            (await this.ingredientImageService.getCachedImage(ingredient.name));
        } catch {
          imageUrl = resolveIngredientImageUrl(ingredient);
        }
      const existing = merged.get(key);
      if (existing) {
        existing.amounts.push(scaledAmount);
        existing.imageUrl = existing.imageUrl ?? imageUrl;
      } else {
        merged.set(key, {
          aisle: normalizedAisle,
          amounts: [scaledAmount],
          imageUrl,
          isManual: false,
        });
      }
    }
  }

  private buildGroceryIngredientKey(aisle: string, ingredientName: string): string {
    return `${aisle}::${ingredientName.trim().toLowerCase()}`;
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
