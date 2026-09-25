export interface MealPlannerProfile {
  householdSize: number;
  maxReadyMinutes: number;
  updatedAt: string;
}

export interface RecipeIngredient {
  name: string;
  aisle: string;
  amount: number;
  unit: string;
  original: string;
}

export interface CachedRecipe {
  id?: number;
  spoonacularId: number;
  title: string;
  imageUrl?: string;
  readyInMinutes?: number;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  sourceUrl?: string;
  cachedAt: string;
}

export interface PlanMeal {
  id?: number;
  weeklyPlanId?: number;
  cachedRecipeId: number;
  slotIndex: number;
  recipe?: CachedRecipe;
  extraGuests: number;
  eventNote?: string;
  isCooked: boolean;
  cookTimeBucket?: string;
  reactionEmoji?: string;
  cookedAt?: string;
}

export interface WeeklyPlan {
  id?: number;
  weekStartDate: string;
  weekServingDelta: number;
  weekNote?: string;
  meals: PlanMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface GroceryItem {
  id?: number;
  weeklyPlanId: number;
  aisle: string;
  ingredientName: string;
  amountText: string;
  isChecked: boolean;
  sortOrder: number;
}

export interface WeeklySummary {
  weekStartDate: string;
  mealsPlanned: number;
  mealsCooked: number;
  favoriteReaction?: string;
  averageReadyMinutes?: number;
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
}
