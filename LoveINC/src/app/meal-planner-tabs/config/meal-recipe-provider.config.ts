/** Switch recipe API for A/B testing — no UI toggle. */
export type MealRecipeProvider = 'spoonacular' | 'myplate';

export const MEAL_RECIPE_PROVIDER: MealRecipeProvider = 'myplate';

export const MEAL_RECIPE_ATTRIBUTION =
  MEAL_RECIPE_PROVIDER === 'myplate'
    ? 'Recipes from USDA MyPlate Kitchen via myplate.food'
    : 'Recipes provided by Spoonacular';
