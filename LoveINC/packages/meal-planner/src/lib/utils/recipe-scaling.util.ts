import type { RecipeIngredient } from '../types/meal-planner.types';

export interface IngredientLineDisplay {
  whole?: string;
  fraction?: string;
  remainder: string;
}

export function getTargetServings(
  householdSize: number,
  weekServingDelta: number,
  extraGuests: number
): number {
  return householdSize + weekServingDelta + extraGuests;
}

export function getRecipeScaleFactor(recipeServings: number, targetServings: number): number {
  if (recipeServings <= 0) {
    return 1;
  }
  return targetServings / recipeServings;
}

/** Leading quantity from a free-text ingredient line (MyPlate text, or Spoonacular original). */
function parseLeadingAmount(original: string): number | undefined {
  const mixed = original.match(/^(\d+)\s+(\d+)\/(\d+)(?:\s|$)/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  const fraction = original.match(/^(\d+)\/(\d+)(?:\s|$)/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const decimal = original.match(/^(\d+(?:\.\d+)?)(?:\s|$)/);
  if (decimal) {
    return Number(decimal[1]);
  }

  return undefined;
}

function getIngredientBaseAmount(ingredient: RecipeIngredient): number {
  if (ingredient.amount > 0) {
    return ingredient.amount;
  }
  return parseLeadingAmount(ingredient.original) ?? 0;
}

function roundScaledAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

const COMMON_FRACTIONS: Array<[number, string]> = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [7 / 8, '7/8'],
];

/** Grocery list amount text (amount + unit, or original when unscaled). */
export function formatScaledIngredientAmount(ingredient: RecipeIngredient, scale: number): string {
  if (scale === 1) {
    return ingredient.original;
  }

  const baseAmount = getIngredientBaseAmount(ingredient);
  if (!baseAmount) {
    return ingredient.original;
  }

  if (ingredient.unit) {
    const scaledText = formatScaledAmountForDisplay(roundScaledAmount(baseAmount * scale));
    return `${scaledText} ${ingredient.unit}`.trim();
  }

  return formatScaledIngredientLine(ingredient, scale);
}

/** Full ingredient line for recipe detail — scales the leading quantity, keeps Spoonacular wording. */
export function formatScaledIngredientLine(ingredient: RecipeIngredient, scale: number): string {
  if (scale === 1) {
    return ingredient.original;
  }

  const baseAmount = getIngredientBaseAmount(ingredient);
  if (!baseAmount) {
    return ingredient.original;
  }

  const scaledText = formatScaledAmountForDisplay(roundScaledAmount(baseAmount * scale));
  const leadingQuantity = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*/;
  const match = ingredient.original.match(leadingQuantity);
  if (!match) {
    return ingredient.original;
  }

  const rest = ingredient.original.slice(match[0].length).trimStart();
  return rest ? `${scaledText} ${rest}` : scaledText;
}

function formatScaledAmountForDisplay(value: number): string {
  const rounded = roundScaledAmount(value);
  if (rounded <= 0) {
    return '0';
  }

  let whole = Math.floor(rounded + 1e-9);
  let frac = roundScaledAmount(rounded - whole);

  if (frac >= 1 - 1e-9) {
    whole += 1;
    frac = 0;
  }

  if (frac < 0.01) {
    return String(whole);
  }

  let closest = COMMON_FRACTIONS[0];
  let closestDiff = Math.abs(frac - closest[0]);
  for (const entry of COMMON_FRACTIONS) {
    const diff = Math.abs(frac - entry[0]);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = entry;
    }
  }

  const fractionText = closest[1];
  return whole > 0 ? `${whole} ${fractionText}` : fractionText;
}

/** Split a quantity-led ingredient line so UI can style the fraction smaller. */
export function parseIngredientLineForDisplay(line: string): IngredientLineDisplay {
  const mixed = line.match(/^(\d+)\s+(\d+\/\d+)\s+(.*)$/);
  if (mixed) {
    return normalizeIngredientLineDisplay({
      whole: mixed[1],
      fraction: mixed[2],
      remainder: mixed[3],
    });
  }

  const mixedGlued = line.match(/^(\d+)\s+(\d+\/\d+)([^\s].*)$/);
  if (mixedGlued) {
    return normalizeIngredientLineDisplay({
      whole: mixedGlued[1],
      fraction: mixedGlued[2],
      remainder: mixedGlued[3],
    });
  }

  const fractionLeading = line.match(/^(\d+\/\d+)\s+(.*)$/);
  if (fractionLeading) {
    return normalizeIngredientLineDisplay({
      fraction: fractionLeading[1],
      remainder: fractionLeading[2],
    });
  }

  const fractionGlued = line.match(/^(\d+\/\d+)([^\s].*)$/);
  if (fractionGlued) {
    return normalizeIngredientLineDisplay({
      fraction: fractionGlued[1],
      remainder: fractionGlued[2],
    });
  }

  const wholeLeading = line.match(/^(\d+)\s+(.*)$/);
  if (wholeLeading) {
    return normalizeIngredientLineDisplay({
      whole: wholeLeading[1],
      remainder: wholeLeading[2],
    });
  }

  const wholeGlued = line.match(/^(\d+)([^\s\d/].*)$/);
  if (wholeGlued) {
    return normalizeIngredientLineDisplay({
      whole: wholeGlued[1],
      remainder: wholeGlued[2],
    });
  }

  return { remainder: line };
}

function normalizeIngredientLineDisplay(parts: IngredientLineDisplay): IngredientLineDisplay {
  if (!parts.whole && !parts.fraction) {
    return parts;
  }

  return {
    ...parts,
    remainder: parts.remainder.trimStart(),
  };
}
