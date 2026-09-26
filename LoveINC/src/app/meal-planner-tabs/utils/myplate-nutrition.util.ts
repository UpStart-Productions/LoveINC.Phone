import type { RecipeNutritionFact } from '@upstart-productions/meal-planner';

interface MyPlateNutritionRow {
  key: string;
  name: string;
  amount: number;
  unit?: string | null;
  indent?: number;
}

export const RECIPE_NUTRITION_DISPLAY_KEYS = [
  'total_calories',
  'total_fat',
  'saturated_fat',
  'cholesterol',
  'carbohydrates',
  'dietary_fiber',
  'protein',
  'sodium',
] as const;

export function mapMyPlateNutrition(rows: MyPlateNutritionRow[] | undefined): RecipeNutritionFact[] {
  return (rows ?? []).map((row) => ({
    key: row.key,
    name: row.name,
    amount: row.amount,
    unit: row.unit ?? undefined,
    indent: row.indent ?? 0,
  }));
}

export function extractCaloriesPerServing(nutrition: RecipeNutritionFact[] | undefined): number | undefined {
  const calories = nutrition?.find((row) => row.key === 'total_calories');
  if (calories == null || calories.amount <= 0) {
    return undefined;
  }
  return Math.round(calories.amount);
}

export function nutritionFactsForDisplay(
  nutrition: RecipeNutritionFact[] | undefined
): RecipeNutritionFact[] {
  if (!nutrition?.length) {
    return [];
  }

  const byKey = new Map(nutrition.map((row) => [row.key, row]));
  return RECIPE_NUTRITION_DISPLAY_KEYS.map((key) => byKey.get(key)).filter(
    (row): row is RecipeNutritionFact => row != null
  );
}

export function formatNutritionAmount(fact: RecipeNutritionFact): string {
  const rounded =
    fact.key === 'total_calories' ? Math.round(fact.amount) : Math.round(fact.amount * 10) / 10;
  if (fact.unit) {
    return `${rounded} ${fact.unit}`;
  }
  return String(rounded);
}

/** FDA Daily Values (2,000 cal). Per-serving high = at or above 20% DV. */
const NUTRITION_HIGH_THRESHOLDS: Partial<Record<(typeof RECIPE_NUTRITION_DISPLAY_KEYS)[number], number>> =
  {
    total_calories: 400,
    total_fat: 16,
    saturated_fat: 4,
    cholesterol: 60,
    sodium: 460,
  };

export function isNutritionAmountHigh(fact: RecipeNutritionFact): boolean {
  const threshold = NUTRITION_HIGH_THRESHOLDS[fact.key as (typeof RECIPE_NUTRITION_DISPLAY_KEYS)[number]];
  if (threshold == null) {
    return false;
  }
  return fact.amount >= threshold;
}
