import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CachedRecipe, RecipeIngredient, SpoonacularSearchResult } from '@upstart-productions/meal-planner';
import { MealPlannerRecipeService } from '@upstart-productions/meal-planner';
import { SPOONACULAR_API_KEY } from '../config/spoonacular-api.config';

interface SpoonacularSearchResponse {
  results: Array<{
    id: number;
    title: string;
    image?: string;
    readyInMinutes?: number;
  }>;
}

interface SpoonacularRecipeDetail {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings: number;
  sourceUrl?: string;
  extendedIngredients?: Array<{
    aisle?: string;
    name?: string;
    original?: string;
    amount?: number;
    unit?: string;
  }>;
  analyzedInstructions?: Array<{
    steps?: Array<{ step?: string }>;
  }>;
  instructions?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SpoonacularService {
  private readonly baseUrl = 'https://api.spoonacular.com';

  constructor(
    private http: HttpClient,
    private recipeService: MealPlannerRecipeService
  ) {}

  async searchRecipes(query: string, maxReadyTime: number): Promise<SpoonacularSearchResult[]> {
    if (!SPOONACULAR_API_KEY) {
      throw new Error('Spoonacular API key is not configured.');
    }
    const params = new HttpParams()
      .set('apiKey', SPOONACULAR_API_KEY)
      .set('query', query.trim())
      .set('number', '12')
      .set('maxReadyTime', String(maxReadyTime))
      .set('addRecipeInformation', 'false');

    const response = await firstValueFrom(
      this.http.get<SpoonacularSearchResponse>(`${this.baseUrl}/recipes/complexSearch`, { params })
    );

    return (response.results ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      image: item.image,
      readyInMinutes: item.readyInMinutes,
    }));
  }

  async fetchAndCacheRecipe(spoonacularId: number): Promise<CachedRecipe> {
    const cached = await this.recipeService.getCachedRecipeBySpoonacularId(spoonacularId);
    if (cached) {
      return cached;
    }
    const detail = await this.fetchRecipeDetail(spoonacularId);
    return this.recipeService.upsertCachedRecipe(detail);
  }

  private async fetchRecipeDetail(spoonacularId: number): Promise<Omit<CachedRecipe, 'id'>> {
    if (!SPOONACULAR_API_KEY) {
      throw new Error('Spoonacular API key is not configured.');
    }
    const params = new HttpParams()
      .set('apiKey', SPOONACULAR_API_KEY)
      .set('includeNutrition', 'false');

    const detail = await firstValueFrom(
      this.http.get<SpoonacularRecipeDetail>(`${this.baseUrl}/recipes/${spoonacularId}/information`, {
        params,
      })
    );

    const ingredients: RecipeIngredient[] = (detail.extendedIngredients ?? []).map((item) => ({
      name: item.name ?? 'Ingredient',
      aisle: item.aisle ?? 'Other',
      amount: Number(item.amount ?? 0),
      unit: item.unit ?? '',
      original: item.original ?? item.name ?? 'Ingredient',
    }));

    const steps = detail.analyzedInstructions?.[0]?.steps ?? [];
    const instructions =
      steps.length > 0
        ? steps.map((step) => String(step.step ?? '').trim()).filter(Boolean)
        : detail.instructions
          ? [detail.instructions]
          : ['See recipe source for instructions.'];

    return {
      spoonacularId: detail.id,
      title: detail.title,
      imageUrl: detail.image,
      readyInMinutes: detail.readyInMinutes,
      servings: detail.servings || 4,
      ingredients,
      instructions,
      sourceUrl: detail.sourceUrl,
      cachedAt: new Date().toISOString(),
    };
  }
}
