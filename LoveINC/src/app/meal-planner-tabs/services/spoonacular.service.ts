import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CachedRecipe, RecipeIngredient, SpoonacularSearchResult } from '@upstart-productions/meal-planner';
import {
  MealPlannerIngredientImageService,
  MealPlannerRecipeService,
  buildIngredientSearchQueries,
  ingredientImageUrlFromFile,
  normalizeIngredientImageFile,
  resolveIngredientImageUrl,
} from '@upstart-productions/meal-planner';
import { SPOONACULAR_API_KEY } from '../config/spoonacular-api.config';

interface SpoonacularSearchResponse {
  results: Array<{
    id: number;
    title: string;
    image?: string;
    readyInMinutes?: number;
  }>;
}

interface SpoonacularIngredientSearchResponse {
  results?: Array<{
    image?: string;
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
    id?: number;
    aisle?: string;
    name?: string;
    original?: string;
    amount?: number;
    unit?: string;
    image?: string;
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
  private readonly backfilledRecipeIds = new Set<number>();

  constructor(
    private http: HttpClient,
    private recipeService: MealPlannerRecipeService,
    private ingredientImageService: MealPlannerIngredientImageService
  ) {}

  async searchRecipes(options: {
    query?: string;
    type?: string;
    diet?: string;
    maxReadyTime: number;
  }): Promise<SpoonacularSearchResult[]> {
    if (!SPOONACULAR_API_KEY) {
      throw new Error('Spoonacular API key is not configured.');
    }
    const query = options.query?.trim() ?? '';
    const type = options.type?.trim() ?? '';
    const diet = options.diet?.trim() ?? '';
    if (!query && !type && !diet) {
      return [];
    }

    let params = new HttpParams()
      .set('apiKey', SPOONACULAR_API_KEY)
      .set('number', '12')
      .set('maxReadyTime', String(options.maxReadyTime))
      .set('addRecipeInformation', 'false');
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

    return (response.results ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      image: item.image,
      readyInMinutes: item.readyInMinutes,
    }));
  }

  async fetchIngredientImage(
    ingredientName: string,
    original?: string
  ): Promise<string | undefined> {
    const trimmed = ingredientName.trim();
    if (!trimmed) {
      return undefined;
    }

    const cached = await this.ingredientImageService.getCachedImage(trimmed);
    if (cached) {
      return cached;
    }

    const queries = buildIngredientSearchQueries(trimmed, original);
    for (const query of queries) {
      const imageUrl = await this.lookupIngredientImage(query);
      if (imageUrl) {
        await this.ingredientImageService.cacheImage(trimmed, imageUrl);
        return imageUrl;
      }
    }

    return undefined;
  }

  async refreshCachedRecipeIngredientImages(recipe: CachedRecipe): Promise<CachedRecipe> {
    if (this.backfilledRecipeIds.has(recipe.spoonacularId)) {
      return recipe;
    }
    if (recipe.ingredients.every((ingredient) => ingredient.imageFile?.trim())) {
      this.backfilledRecipeIds.add(recipe.spoonacularId);
      return recipe;
    }

    const fresh = await this.fetchRecipeDetail(recipe.spoonacularId);
    this.backfilledRecipeIds.add(recipe.spoonacularId);

    const freshByName = new Map(
      fresh.ingredients.map((ingredient) => [ingredient.name.trim().toLowerCase(), ingredient])
    );

    const ingredients = recipe.ingredients.map((ingredient) => {
      if (ingredient.imageFile?.trim()) {
        return ingredient;
      }
      const match = freshByName.get(ingredient.name.trim().toLowerCase());
      if (!match?.imageFile?.trim()) {
        return ingredient;
      }
      return {
        ...ingredient,
        imageFile: match.imageFile,
        spoonacularIngredientId: match.spoonacularIngredientId ?? ingredient.spoonacularIngredientId,
      };
    });

    const updated = await this.recipeService.upsertCachedRecipe({
      ...recipe,
      ingredients,
    });

    await this.cacheRecipeIngredientImages(updated);
    return updated;
  }

  private async cacheRecipeIngredientImages(recipe: CachedRecipe): Promise<void> {
    for (const ingredient of recipe.ingredients) {
      const imageUrl = resolveIngredientImageUrl(ingredient);
      if (!imageUrl) {
        continue;
      }
      await this.ingredientImageService.cacheImage(ingredient.name, imageUrl);
    }
  }

  private async lookupIngredientImage(ingredientName: string): Promise<string | undefined> {
    if (!SPOONACULAR_API_KEY) {
      return undefined;
    }

    const params = new HttpParams()
      .set('apiKey', SPOONACULAR_API_KEY)
      .set('query', ingredientName)
      .set('number', '1');

    try {
      const response = await firstValueFrom(
        this.http.get<SpoonacularIngredientSearchResponse>(
          `${this.baseUrl}/food/ingredients/search`,
          { params }
        )
      );
      const imageFile = response.results?.[0]?.image;
      if (!imageFile) {
        return undefined;
      }
      return ingredientImageUrlFromFile(imageFile);
    } catch {
      return undefined;
    }
  }

  async fetchAndCacheRecipe(spoonacularId: number): Promise<CachedRecipe> {
    const cached = await this.recipeService.getCachedRecipeBySpoonacularId(spoonacularId);
    if (cached) {
      return cached;
    }
    const detail = await this.fetchRecipeDetail(spoonacularId);
    const saved = await this.recipeService.upsertCachedRecipe(detail);
    this.backfilledRecipeIds.add(spoonacularId);
    await this.cacheRecipeIngredientImages(saved);
    return saved;
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
      spoonacularIngredientId: item.id,
      imageFile: normalizeIngredientImageFile(item.image),
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
