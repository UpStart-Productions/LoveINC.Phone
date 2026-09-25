import { Injectable } from '@angular/core';
import type {
  CachedRecipe,
  GroceryItem,
  PlanMeal,
  WeeklyPlan,
  WeeklySummary,
} from '../types/meal-planner.types';
import { MEALS_PER_WEEK } from '../constants/cook.constants';
import { getCurrentWeekStart } from '../utils/week-date.util';
import {
  formatScaledIngredientAmount,
  getRecipeScaleFactor,
  getTargetServings,
} from '../utils/recipe-scaling.util';
import { MealPlannerDatabaseService } from './meal-planner-database.service';
import { MealPlannerProfileService } from './meal-planner-profile.service';
import { MealPlannerRecipeService } from './meal-planner-recipe.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerPlanService {
  constructor(
    private dbService: MealPlannerDatabaseService,
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
         reaction_emoji = NULL, cooked_at = NULL WHERE id = ?`,
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

  async markMealCooked(
    planMealId: number,
    cookTimeBucket: string,
    reactionEmoji: string
  ): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run(
      `UPDATE plan_meals SET is_cooked = 1, cook_time_bucket = ?, reaction_emoji = ?, cooked_at = ?
       WHERE id = ?`,
      [cookTimeBucket, reactionEmoji, new Date().toISOString(), planMealId]
    );
  }

  async unmarkMealCooked(planMealId: number): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run(
      `UPDATE plan_meals SET is_cooked = 0, cook_time_bucket = NULL, reaction_emoji = NULL, cooked_at = NULL
       WHERE id = ?`,
      [planMealId]
    );
  }

  async getGroceryItems(weekStartDate: string): Promise<GroceryItem[]> {
    const plan = await this.getWeeklyPlan(weekStartDate);
    if (!plan?.id) {
      return [];
    }
    const db = await this.dbService.getDbConnection();
    const result = await db.query(
      'SELECT * FROM grocery_items WHERE weekly_plan_id = ? ORDER BY aisle ASC, sort_order ASC, ingredient_name ASC',
      [plan.id]
    );
    return (result.values ?? []).map((row) => ({
      id: Number(row['id']),
      weeklyPlanId: Number(row['weekly_plan_id']),
      aisle: String(row['aisle']),
      ingredientName: String(row['ingredient_name']),
      amountText: String(row['amount_text']),
      isChecked: Boolean(row['is_checked']),
      sortOrder: Number(row['sort_order']),
    }));
  }

  async setGroceryItemChecked(itemId: number, checked: boolean): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run('UPDATE grocery_items SET is_checked = ? WHERE id = ?', [checked ? 1 : 0, itemId]);
  }

  async getWeeklySummary(weekStartDate: string): Promise<WeeklySummary> {
    const plan = await this.getWeeklyPlan(weekStartDate);
    const meals = plan?.meals ?? [];
    const cooked = meals.filter((m) => m.isCooked);
    const reactionCounts = new Map<string, number>();
    let readyTotal = 0;
    let readyCount = 0;

    for (const meal of cooked) {
      if (meal.reactionEmoji) {
        reactionCounts.set(meal.reactionEmoji, (reactionCounts.get(meal.reactionEmoji) ?? 0) + 1);
      }
      if (meal.recipe?.readyInMinutes) {
        readyTotal += meal.recipe.readyInMinutes;
        readyCount += 1;
      }
    }

    let favoriteReaction: string | undefined;
    let maxCount = 0;
    for (const [emoji, count] of reactionCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteReaction = emoji;
      }
    }

    return {
      weekStartDate,
      mealsPlanned: meals.length,
      mealsCooked: cooked.length,
      favoriteReaction,
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
    const profile = await this.profileService.getProfile();
    const householdSize = profile?.householdSize ?? 2;
    const db = await this.dbService.getDbConnection();
    await db.run('DELETE FROM grocery_items WHERE weekly_plan_id = ?', [plan.id]);

    const merged = new Map<string, { aisle: string; amounts: string[] }>();

    for (const meal of plan.meals) {
      const recipe = meal.recipe ?? (await this.recipeService.getCachedRecipeById(meal.cachedRecipeId));
      if (!recipe) {
        continue;
      }
      const targetServings = getTargetServings(
        householdSize,
        plan.weekServingDelta,
        meal.extraGuests
      );
      const scale = getRecipeScaleFactor(recipe.servings, targetServings);

      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.aisle}::${ingredient.name.toLowerCase()}`;
        const scaledAmount = formatScaledIngredientAmount(ingredient, scale);
        const existing = merged.get(key);
        if (existing) {
          existing.amounts.push(scaledAmount);
        } else {
          merged.set(key, { aisle: ingredient.aisle || 'Other', amounts: [scaledAmount] });
        }
      }
    }

    const aisleOrder = [...merged.values()]
      .map((v) => v.aisle)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b));

    let sortOrder = 0;
    for (const aisle of aisleOrder) {
      const items = [...merged.entries()]
        .filter(([, v]) => v.aisle === aisle)
        .sort((a, b) => a[0].localeCompare(b[0]));

      for (const [key, value] of items) {
        const ingredientName = key.split('::')[1] ?? key;
        const amountText = value.amounts.join(' + ');
        await db.run(
          `INSERT INTO grocery_items
           (weekly_plan_id, aisle, ingredient_name, amount_text, is_checked, sort_order)
           VALUES (?, ?, ?, ?, 0, ?)`,
          [plan.id, aisle, this.titleCase(ingredientName), amountText, sortOrder++]
        );
      }
    }
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
