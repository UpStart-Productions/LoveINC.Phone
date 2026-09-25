/** Store walk order for normalized grocery sections. */
export const GROCERY_AISLE_ORDER = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Frozen',
  'Canned & Jarred',
  'Pasta, Rice & Grains',
  'Baking',
  'Oils & Vinegars',
  'Spices & Seasonings',
  'Condiments & Sauces',
  'Snacks',
  'Beverages',
  'International & Ethnic',
  'Pantry',
  'Other',
] as const;

const NAME_AISLE_RULES: Array<{ pattern: RegExp; aisle: string }> = [
  { pattern: /\b(oils?|vinegars?|vinaigrettes?|salad dressings?|dressings?)\b/i, aisle: 'Oils & Vinegars' },
  { pattern: /\b(soy sauce|fish sauce|oyster sauce|hoisin|sriracha|ketchup|mustard|mayonnaise|mayo)\b/i, aisle: 'Condiments & Sauces' },
  { pattern: /\b(chicken|beef|pork|lamb|turkey|sausage|bacon|steak|ground meat)\b/i, aisle: 'Meat & Seafood' },
  { pattern: /\b(shrimp|salmon|tuna|cod|fish|seafood|scallops?|crab|lobster)\b/i, aisle: 'Meat & Seafood' },
];

const SPOONACULAR_AISLE_RULES: Array<{ pattern: RegExp; aisle: string }> = [
  { pattern: /produce/i, aisle: 'Produce' },
  { pattern: /meat|seafood|poultry/i, aisle: 'Meat & Seafood' },
  { pattern: /milk|dairy|egg|cheese/i, aisle: 'Dairy & Eggs' },
  { pattern: /bakery|bread/i, aisle: 'Bakery & Bread' },
  { pattern: /frozen/i, aisle: 'Frozen' },
  { pattern: /canned|jarred/i, aisle: 'Canned & Jarred' },
  { pattern: /pasta|rice|grain/i, aisle: 'Pasta, Rice & Grains' },
  { pattern: /baking/i, aisle: 'Baking' },
  { pattern: /oil|vinegar|dressing/i, aisle: 'Oils & Vinegars' },
  { pattern: /spice|seasoning/i, aisle: 'Spices & Seasonings' },
  { pattern: /condiment|sauce/i, aisle: 'Condiments & Sauces' },
  { pattern: /snack/i, aisle: 'Snacks' },
  { pattern: /beverage|coffee|tea|drink/i, aisle: 'Beverages' },
  { pattern: /ethnic|international/i, aisle: 'International & Ethnic' },
  { pattern: /nut butter|jam|honey|gourmet|health food|pantry|cereal/i, aisle: 'Pantry' },
];

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function matchAisleRules(rules: Array<{ pattern: RegExp; aisle: string }>, value: string): string | undefined {
  for (const rule of rules) {
    if (rule.pattern.test(value)) {
      return rule.aisle;
    }
  }
  return undefined;
}

/**
 * Map Spoonacular aisle + ingredient name to a consistent in-store section.
 * Pure string rules — no network or AI.
 */
export function normalizeGroceryAisle(
  spoonacularAisle: string | undefined,
  ingredientName: string,
  ingredientOriginal?: string
): string {
  for (const candidate of [ingredientName, ingredientOriginal]) {
    const text = candidate?.trim();
    if (!text) {
      continue;
    }
    const fromName = matchAisleRules(NAME_AISLE_RULES, text);
    if (fromName) {
      return fromName;
    }
  }

  const aisle = normalizeLookupKey(spoonacularAisle ?? '');
  if (!aisle) {
    return 'Other';
  }

  const fromAisle = matchAisleRules(SPOONACULAR_AISLE_RULES, aisle);
  if (fromAisle) {
    return fromAisle;
  }

  return 'Pantry';
}

export function compareGroceryAisles(a: string, b: string): number {
  const order = GROCERY_AISLE_ORDER as readonly string[];
  const aIndex = order.indexOf(a);
  const bIndex = order.indexOf(b);
  const aRank = aIndex === -1 ? order.length : aIndex;
  const bRank = bIndex === -1 ? order.length : bIndex;
  if (aRank !== bRank) {
    return aRank - bRank;
  }
  return a.localeCompare(b);
}
