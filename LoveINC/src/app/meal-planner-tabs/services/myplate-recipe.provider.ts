import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CachedRecipe, RecipeIngredient } from '@upstart-productions/meal-planner';
import { MealPlannerRecipeService } from '@upstart-productions/meal-planner';
import type {
  MealRecipeProviderAdapter,
  RecipeExternalKey,
  RecipeSearchCriteria,
  RecipeSearchPage,
  RecipeSearchResult,
} from './recipe-provider.types';
import { RECIPE_SEARCH_PAGE_SIZE } from './recipe-provider.types';
import {
  extractCaloriesPerServing,
  mapMyPlateNutrition,
} from '../utils/myplate-nutrition.util';

const MYPLATE_API_BASE = 'https://myplate.food/api/v1';

const TYPE_TO_MYPLATE_CATEGORY: Record<string, string> = {
  'main course': 'Main dish',
  soup: 'Soup',
  salad: 'Salad',
  breakfast: 'Breakfast',
  'side dish': 'Side dish',
  snack: 'Snack',
  dessert: 'Dessert',
};

interface MyPlateSearchResponse {
  total?: number;
  count?: number;
  results?: Array<{
    slug: string;
    name: string;
    image_url?: string;
    calories?: number;
    category?: string;
  }>;
  error?: string;
}

interface MyPlateRecipeDetail {
  slug: string;
  name: string;
  description?: string;
  yield?: string;
  ingredients?: Array<{ text: string; note?: string | null }>;
  directions?: string;
  nutrition?: Array<{
    key: string;
    name: string;
    amount: number;
    unit?: string | null;
    indent?: number;
  }>;
  image_url?: string;
  recipe_url?: string;
  source_url?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MyPlateRecipeProvider implements MealRecipeProviderAdapter {
  constructor(
    private http: HttpClient,
    private recipeService: MealPlannerRecipeService
  ) {}

  async searchRecipes(criteria: RecipeSearchCriteria): Promise<RecipeSearchPage> {
    const query = criteria.query?.trim() ?? '';
    const type = criteria.type?.trim() ?? '';
    const diet = criteria.diet?.trim() ?? '';
    if (!query && !type && !diet) {
      return { results: [], total: 0, offset: 0, limit: RECIPE_SEARCH_PAGE_SIZE };
    }

    const limit = criteria.limit ?? RECIPE_SEARCH_PAGE_SIZE;
    const offset = criteria.offset ?? 0;
    let params = new HttpParams().set('limit', String(limit)).set('offset', String(offset));
    const category = type ? TYPE_TO_MYPLATE_CATEGORY[type.toLowerCase()] : undefined;
    if (query) {
      params = params.set('q', query);
    } else if (diet === 'vegetarian') {
      params = params.set('q', 'vegetarian');
    } else if (type === 'fish') {
      params = params.set('q', 'fish');
    } else if (type === 'poultry') {
      params = params.set('q', 'chicken');
    } else if (type === 'beef') {
      params = params.set('q', 'beef');
    }
    if (category) {
      params = params.set('category', category);
    }

    let response: MyPlateSearchResponse;
    try {
      response = await firstValueFrom(
        this.http.get<MyPlateSearchResponse>(`${MYPLATE_API_BASE}/recipes`, { params })
      );
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429) {
        throw new Error('MyPlate recipe limit reached. Try again later.');
      }
      throw err;
    }

    if (response.error) {
      throw new Error(response.error);
    }

    const results = (response.results ?? []).map((item): RecipeSearchResult => ({
      recipeSource: 'myplate',
      externalId: item.slug,
      title: item.name,
      image: item.image_url,
      caloriesPerServing: item.calories != null ? Math.round(item.calories) : undefined,
    }));

    const total = response.total ?? offset + results.length;

    return { results, total, offset, limit };
  }

  async fetchAndCacheRecipe(key: RecipeExternalKey): Promise<CachedRecipe> {
    const cached = await this.recipeService.getCachedRecipeByExternalKey('myplate', key.externalId);
    if (cached?.nutrition?.length) {
      return cached;
    }

    const detail = await this.fetchRecipeDetail(key.externalId);
    return this.recipeService.upsertCachedRecipe(detail);
  }

  private async fetchRecipeDetail(slug: string): Promise<Omit<CachedRecipe, 'id' | 'cachedAt'>> {
    let detail: MyPlateRecipeDetail;
    try {
      detail = await firstValueFrom(
        this.http.get<MyPlateRecipeDetail>(`${MYPLATE_API_BASE}/recipes/${encodeURIComponent(slug)}`)
      );
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429) {
        throw new Error('MyPlate recipe limit reached. Try again later.');
      }
      throw err;
    }

    if (detail.error) {
      throw new Error(detail.error);
    }

    const ingredients: RecipeIngredient[] = (detail.ingredients ?? []).map((item) => ({
      name: item.text,
      aisle: 'Other',
      amount: 0,
      unit: '',
      original: item.note ? `${item.text} (${item.note})` : item.text,
    }));

    const directions = detail.directions?.trim();
    const instructions = directions
      ? splitDirections(directions)
      : detail.description
        ? [detail.description]
        : ['See recipe source for instructions.'];

    const nutrition = mapMyPlateNutrition(detail.nutrition);

    return {
      recipeSource: 'myplate',
      externalId: detail.slug,
      spoonacularId: this.recipeService.myplateSpoonacularPlaceholder(detail.slug),
      title: detail.name,
      imageUrl: detail.image_url,
      servings: parseServings(detail.yield),
      nutrition,
      caloriesPerServing: extractCaloriesPerServing(nutrition),
      ingredients,
      instructions,
      sourceUrl: detail.source_url ?? detail.recipe_url,
    };
  }
}

function parseServings(yieldLabel?: string): number {
  const match = yieldLabel?.match(/(\d+)/);
  return match ? Number(match[1]) : 4;
}

function splitDirections(directions: string): string[] {
  const steps = directions
    .split(/(?<=[.!])\s+/)
    .map((step) => step.trim())
    .filter(Boolean);
  return steps.length ? steps : [directions];
}
