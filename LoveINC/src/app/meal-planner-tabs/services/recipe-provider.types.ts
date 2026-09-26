import type { CachedRecipe, RecipeSource } from '@upstart-productions/meal-planner';

export const RECIPE_SEARCH_PAGE_SIZE = 10;

export interface RecipeSearchCriteria {
  query?: string;
  type?: string;
  diet?: string;
  maxReadyTime: number;
  limit?: number;
  offset?: number;
}

export interface RecipeSearchPage {
  results: RecipeSearchResult[];
  total: number;
  offset: number;
  limit: number;
}

export interface RecipeSearchResult {
  recipeSource: RecipeSource;
  externalId: string;
  title: string;
  image?: string;
  readyInMinutes?: number;
  caloriesPerServing?: number;
}

export interface RecipeExternalKey {
  recipeSource: RecipeSource;
  externalId: string;
}

export function encodeRecipeExternalKey(key: RecipeExternalKey): string {
  return `${key.recipeSource}:${key.externalId}`;
}

export function decodeRecipeExternalKey(value: string): RecipeExternalKey | null {
  const separatorIndex = value.indexOf(':');
  if (separatorIndex <= 0) {
    return null;
  }
  const recipeSource = value.slice(0, separatorIndex) as RecipeSource;
  if (recipeSource !== 'spoonacular' && recipeSource !== 'myplate') {
    return null;
  }
  const externalId = value.slice(separatorIndex + 1);
  if (!externalId) {
    return null;
  }
  return { recipeSource, externalId };
}

export interface MealRecipeProviderAdapter {
  searchRecipes(criteria: RecipeSearchCriteria): Promise<RecipeSearchPage>;
  fetchAndCacheRecipe(key: RecipeExternalKey): Promise<CachedRecipe>;
}
