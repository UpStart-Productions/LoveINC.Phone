import { Injectable } from '@angular/core';
import type { CachedRecipe } from '@upstart-productions/meal-planner';
import { MEAL_RECIPE_PROVIDER, type MealRecipeProvider } from '../config/meal-recipe-provider.config';
import { MyPlateRecipeProvider } from './myplate-recipe.provider';
import { SpoonacularRecipeProvider } from './spoonacular-recipe.provider';
import type {
  RecipeExternalKey,
  RecipeSearchCriteria,
  RecipeSearchPage,
} from './recipe-provider.types';

@Injectable({
  providedIn: 'root',
})
export class RecipeProviderService {
  constructor(
    private spoonacularProvider: SpoonacularRecipeProvider,
    private myplateProvider: MyPlateRecipeProvider
  ) {}

  get activeProvider(): MealRecipeProvider {
    return MEAL_RECIPE_PROVIDER;
  }

  async searchRecipes(criteria: RecipeSearchCriteria): Promise<RecipeSearchPage> {
    return this.adapter.searchRecipes(criteria);
  }

  async fetchAndCacheRecipe(key: RecipeExternalKey): Promise<CachedRecipe> {
    return this.adapter.fetchAndCacheRecipe(key);
  }

  private get adapter() {
    return MEAL_RECIPE_PROVIDER === 'myplate' ? this.myplateProvider : this.spoonacularProvider;
  }
}
