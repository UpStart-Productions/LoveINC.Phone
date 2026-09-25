import { Injectable } from '@angular/core';
import type { CachedRecipe, RecipeIngredient } from '../types/meal-planner.types';
import { MealPlannerDatabaseService } from './meal-planner-database.service';

interface RecipeRow {
  id: number;
  spoonacular_id: number;
  title: string;
  image_url?: string;
  ready_in_minutes?: number;
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

  async upsertCachedRecipe(recipe: Omit<CachedRecipe, 'id' | 'cachedAt'> & { cachedAt?: string }): Promise<CachedRecipe> {
    const db = await this.dbService.getDbConnection();
    const cachedAt = recipe.cachedAt ?? new Date().toISOString();
    const existing = await this.getCachedRecipeBySpoonacularId(recipe.spoonacularId);
    const ingredientsJson = JSON.stringify(recipe.ingredients);
    const instructionsJson = JSON.stringify(recipe.instructions);

    if (existing?.id) {
      await db.run(
        `UPDATE cached_recipes SET title = ?, image_url = ?, ready_in_minutes = ?, servings = ?,
         ingredients_json = ?, instructions_json = ?, source_url = ?, cached_at = ?
         WHERE id = ?`,
        [
          recipe.title,
          recipe.imageUrl ?? null,
          recipe.readyInMinutes ?? null,
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
       (spoonacular_id, title, image_url, ready_in_minutes, servings, ingredients_json, instructions_json, source_url, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe.spoonacularId,
        recipe.title,
        recipe.imageUrl ?? null,
        recipe.readyInMinutes ?? null,
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

  private mapRecipeRow(row: RecipeRow): CachedRecipe {
    return {
      id: Number(row.id),
      spoonacularId: Number(row.spoonacular_id),
      title: String(row.title),
      imageUrl: row.image_url ? String(row.image_url) : undefined,
      readyInMinutes: row.ready_in_minutes != null ? Number(row.ready_in_minutes) : undefined,
      servings: Number(row.servings),
      ingredients: JSON.parse(String(row.ingredients_json)) as RecipeIngredient[],
      instructions: JSON.parse(String(row.instructions_json)) as string[],
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      cachedAt: String(row.cached_at),
    };
  }
}
