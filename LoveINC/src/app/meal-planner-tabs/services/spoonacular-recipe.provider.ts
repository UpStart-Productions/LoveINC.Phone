import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CachedRecipe, RecipeIngredient } from '@upstart-productions/meal-planner';
import { MealPlannerRecipeService } from '@upstart-productions/meal-planner';
import { SPOONACULAR_API_KEY } from '../config/spoonacular-api.config';
import type {
  MealRecipeProviderAdapter,
  RecipeExternalKey,
  RecipeSearchCriteria,
  RecipeSearchPage,
  RecipeSearchResult,
} from './recipe-provider.types';
import { RECIPE_SEARCH_PAGE_SIZE } from './recipe-provider.types';

interface SpoonacularSearchResponse {
  totalResults?: number;
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
export class SpoonacularRecipeProvider implements MealRecipeProviderAdapter {
  private readonly baseUrl = 'https://api.spoonacular.com';

  constructor(
    private http: HttpClient,
    private recipeService: MealPlannerRecipeService
  ) {}

  async searchRecipes(criteria: RecipeSearchCriteria): Promise<RecipeSearchPage> {
    if (!SPOONACULAR_API_KEY) {
      throw new Error('Spoonacular API key is not configured.');
    }
    const query = criteria.query?.trim() ?? '';
    const type = criteria.type?.trim() ?? '';
    const diet = criteria.diet?.trim() ?? '';
    if (!query && !type && !diet) {
      return { results: [], total: 0, offset: 0, limit: RECIPE_SEARCH_PAGE_SIZE };
    }

    const limit = criteria.limit ?? RECIPE_SEARCH_PAGE_SIZE;
    const offset = criteria.offset ?? 0;

    let params = new HttpParams()
      .set('apiKey', SPOONACULAR_API_KEY)
      .set('number', String(limit))
      .set('offset', String(offset))
      .set('maxReadyTime', String(criteria.maxReadyTime))
      .set('addRecipeInformation', 'true');
    if (query) {
      params = params.set('query', query);
    }
    if (type) {
      params = params.set('type', type);
    }
    if (diet) {
      params = params.set('diet', diet);
    }

    let response: SpoonacularSearchResponse;
    try {
      response = await firstValueFrom(
        this.http.get<SpoonacularSearchResponse>(`${this.baseUrl}/recipes/complexSearch`, { params })
      );
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 402) {
        throw new Error('Spoonacular daily limit reached. Try again tomorrow.');
      }
      throw err;
    }

    const results = (response.results ?? []).map(
      (item): RecipeSearchResult => ({
        recipeSource: 'spoonacular',
        externalId: String(item.id),
        title: item.title,
        image: item.image,
        readyInMinutes: item.readyInMinutes,
      })
    );

    const total = response.totalResults ?? offset + results.length;

    return { results, total, offset, limit };
  }

  async fetchAndCacheRecipe(key: RecipeExternalKey): Promise<CachedRecipe> {
    const spoonacularId = Number(key.externalId);
    if (!Number.isFinite(spoonacularId) || spoonacularId <= 0) {
      throw new Error('Invalid Spoonacular recipe id.');
    }

    const cached = await this.recipeService.getCachedRecipeByExternalKey('spoonacular', key.externalId);
    if (cached) {
      return cached;
    }

    const detail = await this.fetchRecipeDetail(spoonacularId);
    return this.recipeService.upsertCachedRecipe(detail);
  }

  private async fetchRecipeDetail(spoonacularId: number): Promise<Omit<CachedRecipe, 'id' | 'cachedAt'>> {
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
      recipeSource: 'spoonacular',
      externalId: String(detail.id),
      spoonacularId: detail.id,
      title: detail.title,
      imageUrl: detail.image,
      readyInMinutes: detail.readyInMinutes,
      servings: detail.servings || 4,
      ingredients,
      instructions,
      sourceUrl: detail.sourceUrl,
    };
  }
}
