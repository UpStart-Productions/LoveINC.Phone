import { Injectable } from '@angular/core';
import { MealPlannerDatabaseService } from './meal-planner-database.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerIngredientImageService {
  constructor(private dbService: MealPlannerDatabaseService) {}

  async getCachedImage(ingredientName: string): Promise<string | undefined> {
    const db = await this.dbService.getDbConnection();
    const result = await db.query('SELECT image_url FROM ingredient_images WHERE name_key = ?', [
      ingredientName.trim().toLowerCase(),
    ]);
    const imageUrl = result.values?.[0]?.['image_url'];
    return imageUrl ? String(imageUrl) : undefined;
  }

  async cacheImage(ingredientName: string, imageUrl: string): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run(
      `INSERT INTO ingredient_images (name_key, image_url, cached_at)
       VALUES (?, ?, ?)
       ON CONFLICT(name_key) DO UPDATE SET image_url = excluded.image_url, cached_at = excluded.cached_at`,
      [ingredientName.trim().toLowerCase(), imageUrl, new Date().toISOString()]
    );
  }
}
