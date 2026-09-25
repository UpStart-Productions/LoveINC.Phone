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
  spoonacularIngredientId?: number;
  imageFile?: string;
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

import type { MealRecapComplexity } from '../constants/meal-recap.constants';

export type { MealRecapComplexity };

export interface MealRecap {
  reactionEmoji?: string;
  actualCookMinutes?: number;
  complexity?: MealRecapComplexity;
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
  actualCookMinutes?: number;
  complexity?: MealRecapComplexity;
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
  isManual: boolean;
  imageUrl?: string;
  sortOrder: number;
}

export interface WeeklySummary {
  weekStartDate: string;
  mealsPlanned: number;
  averageReadyMinutes?: number;
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
}
