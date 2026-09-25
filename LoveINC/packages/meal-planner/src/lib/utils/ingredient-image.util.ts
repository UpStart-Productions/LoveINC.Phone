import type { RecipeIngredient } from '../types/meal-planner.types';

const INGREDIENT_IMAGE_BASE = 'https://img.spoonacular.com/ingredients_100x100';

export function ingredientImageUrlFromFile(imageFile: string): string {
  return `${INGREDIENT_IMAGE_BASE}/${imageFile.trim()}`;
}

export function normalizeIngredientImageFile(image?: string): string | undefined {
  return image?.trim() || undefined;
}

export function resolveIngredientImageUrl(ingredient: RecipeIngredient): string | undefined {
  const imageFile = normalizeIngredientImageFile(ingredient.imageFile);
  if (imageFile) {
    return ingredientImageUrlFromFile(imageFile);
  }
  return undefined;
}

/** Search queries from most specific to broader — improves Spoonacular hit rate. */
export function buildIngredientSearchQueries(name: string, original?: string): string[] {
  const queries: string[] = [];
  const trimmedName = name.trim();
  if (trimmedName) {
    queries.push(trimmedName);
  }

  const trimmedOriginal = original?.trim();
  if (trimmedOriginal) {
    const strippedOriginal = trimmedOriginal
      .replace(/^[\d\s./-]+(?:cup|cups|tablespoon|tablespoons|tbsp|teaspoon|teaspoons|tsp|ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|milliliter|milliliters|ml|liter|liters|l|can|cans|clove|cloves|package|packages|pkg|slice|slices|pinch|dash)s?\b/i, '')
      .replace(/^\s*of\s+/i, '')
      .replace(/,\s*.+$/, '')
      .trim();
    if (strippedOriginal) {
      queries.push(strippedOriginal);
    }
  }

  const source = (trimmedOriginal || trimmedName).toLowerCase();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    queries.push(words.slice(-2).join(' '));
  }
  if (words.length >= 3) {
    queries.push(words.slice(-3).join(' '));
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const query of queries) {
    const key = query.toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(query);
  }
  return unique.slice(0, 5);
}
