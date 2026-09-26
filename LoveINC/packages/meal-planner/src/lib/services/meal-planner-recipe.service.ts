import { Injectable } from '@angular/core';
import type {
  CachedRecipe,
  RecipeExternalKey,
  RecipeIngredient,
  RecipeNutritionFact,
  RecipeSource,
} from '../types/meal-planner.types';
import { MealPlannerDatabaseService } from './meal-planner-database.service';

interface RecipeRow {
  id: number;
  spoonacular_id: number;
  recipe_source?: string;
  external_id?: string;
  title: string;
  image_url?: string;
  ready_in_minutes?: number;
  calories_per_serving?: number;
  nutrition_json?: string;
  servings: number;
  ingredients_json: string;
  instructions_json: string;
  source_url?: string;
  cached_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class MealPlannerRecipeService {
  constructor(private dbService: MealPlannerDatabaseService) {}

  myplateSpoonacularPlaceholder(slug: string): number {
    let hash = 2166136261;
    for (let i = 0; i < slug.length; i++) {
      hash ^= slug.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash |= 0;
    if (hash === 0) {
      return -1;
    }
    return hash > 0 ? -hash : hash;
  }

  async getCachedRecipeCount(): Promise<number> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query('SELECT COUNT(*) AS count FROM cached_recipes');
    return Number(result.values?.[0]?.['count'] ?? 0);
  }

  async getCachedRecipeById(id: number): Promise<CachedRecipe | null> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query('SELECT * FROM cached_recipes WHERE id = ?', [id]);
    const row = result.values?.[0] as RecipeRow | undefined;
    return row ? this.mapRecipeRow(row) : null;
  }

  async getCachedRecipeBySpoonacularId(spoonacularId: number): Promise<CachedRecipe | null> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query('SELECT * FROM cached_recipes WHERE spoonacular_id = ?', [spoonacularId]);
    const row = result.values?.[0] as RecipeRow | undefined;
    return row ? this.mapRecipeRow(row) : null;
  }

  async getCachedRecipeByExternalKey(
    recipeSource: RecipeSource,
    externalId: string
  ): Promise<CachedRecipe | null> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query(
      'SELECT * FROM cached_recipes WHERE recipe_source = ? AND external_id = ?',
      [recipeSource, externalId]
    );
    const row = result.values?.[0] as RecipeRow | undefined;
    return row ? this.mapRecipeRow(row) : null;
  }

  async getReadyMinutesBySpoonacularIds(
    spoonacularIds: readonly number[]
  ): Promise<Map<number, number>> {
    const ids = [...new Set(spoonacularIds.filter((id) => id > 0))];
    if (!ids.length) {
      return new Map();
    }

    const db = await this.dbService.getDbConnection();
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.query(
      `SELECT spoonacular_id, ready_in_minutes FROM cached_recipes WHERE spoonacular_id IN (${placeholders})`,
      ids
    );

    const readyMinutesBySpoonacularId = new Map<number, number>();
    for (const row of result.values ?? []) {
      if (row['ready_in_minutes'] == null) {
        continue;
      }
      readyMinutesBySpoonacularId.set(Number(row['spoonacular_id']), Number(row['ready_in_minutes']));
    }
    return readyMinutesBySpoonacularId;
  }

  async getReadyMinutesByRecipeKeys(
    keys: readonly RecipeExternalKey[]
  ): Promise<Map<string, number>> {
    const uniqueKeys = [...new Map(keys.map((key) => [this.recipeKeyToken(key), key])).values()];
    if (!uniqueKeys.length) {
      return new Map();
    }

    const db = await this.dbService.getDbConnection();
    const conditions = uniqueKeys.map(() => '(recipe_source = ? AND external_id = ?)').join(' OR ');
    const params = uniqueKeys.flatMap((key) => [key.recipeSource, key.externalId]);
    const result = await db.query(
      `SELECT recipe_source, external_id, ready_in_minutes
       FROM cached_recipes
       WHERE ${conditions}`,
      params
    );

    const readyMinutesByKey = new Map<string, number>();
    for (const row of result.values ?? []) {
      if (row['ready_in_minutes'] == null) {
        continue;
      }
      const key: RecipeExternalKey = {
        recipeSource: String(row['recipe_source']) as RecipeSource,
        externalId: String(row['external_id']),
      };
      readyMinutesByKey.set(this.recipeKeyToken(key), Number(row['ready_in_minutes']));
    }
    return readyMinutesByKey;
  }

  async upsertCachedRecipe(recipe: Omit<CachedRecipe, 'id' | 'cachedAt'> & { cachedAt?: string }): Promise<CachedRecipe> {
    const db = await this.dbService.getDbConnection();
    const cachedAt = recipe.cachedAt ?? new Date().toISOString();
    const existing = await this.getCachedRecipeByExternalKey(recipe.recipeSource, recipe.externalId);
    const ingredientsJson = JSON.stringify(recipe.ingredients);
    const instructionsJson = JSON.stringify(recipe.instructions);
    const nutritionJson = recipe.nutrition?.length ? JSON.stringify(recipe.nutrition) : null;

    if (existing?.id) {
      await db.run(
        `UPDATE cached_recipes SET spoonacular_id = ?, title = ?, image_url = ?, ready_in_minutes = ?,
         calories_per_serving = ?, nutrition_json = ?, servings = ?,
         ingredients_json = ?, instructions_json = ?, source_url = ?, cached_at = ?
         WHERE id = ?`,
        [
          recipe.spoonacularId,
          recipe.title,
          recipe.imageUrl ?? null,
          recipe.readyInMinutes ?? null,
          recipe.caloriesPerServing ?? null,
          nutritionJson,
          recipe.servings,
          ingredientsJson,
          instructionsJson,
          recipe.sourceUrl ?? null,
          cachedAt,
          existing.id,
        ]
      );
      return { ...recipe, id: existing.id, cachedAt };
    }

    const insert = await db.run(
      `INSERT INTO cached_recipes
       (spoonacular_id, recipe_source, external_id, title, image_url, ready_in_minutes, calories_per_serving,
        nutrition_json, servings, ingredients_json, instructions_json, source_url, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe.spoonacularId,
        recipe.recipeSource,
        recipe.externalId,
        recipe.title,
        recipe.imageUrl ?? null,
        recipe.readyInMinutes ?? null,
        recipe.caloriesPerServing ?? null,
        nutritionJson,
        recipe.servings,
        ingredientsJson,
        instructionsJson,
        recipe.sourceUrl ?? null,
        cachedAt,
      ]
    );
    return { ...recipe, id: insert.changes?.lastId, cachedAt };
  }

  async listRecommendations(limit = 12): Promise<CachedRecipe[]> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query(
      `SELECT cr.* FROM cached_recipes cr
       LEFT JOIN favorite_recipes fr ON fr.cached_recipe_id = cr.id
       ORDER BY CASE WHEN fr.id IS NULL THEN 1 ELSE 0 END, cr.cached_at DESC
       LIMIT ?`,
      [limit]
    );
    return (result.values ?? []).map((row) => this.mapRecipeRow(row as RecipeRow));
  }

  async listFavorites(): Promise<CachedRecipe[]> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query(
      `SELECT cr.* FROM favorite_recipes fr
       JOIN cached_recipes cr ON cr.id = fr.cached_recipe_id
       ORDER BY fr.created_at DESC`
    );
    return (result.values ?? []).map((row) => this.mapRecipeRow(row as RecipeRow));
  }

  async isFavorite(cachedRecipeId: number): Promise<boolean> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query('SELECT id FROM favorite_recipes WHERE cached_recipe_id = ?', [cachedRecipeId]);
    return Boolean(result.values?.length);
  }

  async setFavorite(cachedRecipeId: number, favorite: boolean): Promise<void> {
    const db = await this.dbService.getDbConnection();
    if (favorite) {
      await db.run(
        'INSERT OR IGNORE INTO favorite_recipes (cached_recipe_id, created_at) VALUES (?, ?)',
        [cachedRecipeId, new Date().toISOString()]
      );
      return;
    }
    await db.run('DELETE FROM favorite_recipes WHERE cached_recipe_id = ?', [cachedRecipeId]);
  }

  recipeKeyToken(key: RecipeExternalKey): string {
    return `${key.recipeSource}:${key.externalId}`;
  }

  private mapRecipeRow(row: RecipeRow): CachedRecipe {
    const recipeSource = (row.recipe_source ?? 'spoonacular') as RecipeSource;
    const externalId = row.external_id ? String(row.external_id) : String(row.spoonacular_id);

    return {
      id: Number(row.id),
      recipeSource,
      externalId,
      spoonacularId: Number(row.spoonacular_id),
      title: String(row.title),
      imageUrl: row.image_url ? String(row.image_url) : undefined,
      readyInMinutes: row.ready_in_minutes != null ? Number(row.ready_in_minutes) : undefined,
      caloriesPerServing:
        row.calories_per_serving != null ? Number(row.calories_per_serving) : undefined,
      nutrition: row.nutrition_json
        ? (JSON.parse(String(row.nutrition_json)) as RecipeNutritionFact[])
        : undefined,
      servings: Number(row.servings),
      ingredients: JSON.parse(String(row.ingredients_json)) as RecipeIngredient[],
      instructions: JSON.parse(String(row.instructions_json)) as string[],
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      cachedAt: String(row.cached_at),
    };
  }
}
