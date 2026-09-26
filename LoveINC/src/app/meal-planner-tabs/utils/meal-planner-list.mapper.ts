import type { ContentCardListItem } from '../../components/content-card-list/content-card-list.model';
import type { CachedRecipe, GroceryItem, PlanMeal, SpoonacularSearchResult } from '@upstart-productions/meal-planner';

const LIST_AVATAR = { asideAvatarSize: 'large' as const };
const EMPTY_MEAL_AVATAR_BG = '#e0e0e0';

function buildRecipeListDetail(
  readyInMinutes: number | undefined,
  totalServings?: number,
  starRating?: number
): Pick<ContentCardListItem, 'detail' | 'mealStarRating'> {
  const timeLabel =
    readyInMinutes != null && readyInMinutes > 0 ? `${readyInMinutes} min` : undefined;
  const servingsLabel =
    totalServings != null && totalServings > 0 ? `Serves ${totalServings}` : undefined;
  const detailParts = [timeLabel, servingsLabel].filter(Boolean);
  const detail = detailParts.length ? detailParts.join(' · ') : undefined;

  if (starRating != null) {
    return {
      detail,
      mealStarRating: starRating,
    };
  }

  return { detail };
}

function buildMealListDetail(
  meal: PlanMeal,
  recipe: CachedRecipe,
  totalServings: number
): Pick<ContentCardListItem, 'detail' | 'mealStarRating'> {
  return buildRecipeListDetail(recipe.readyInMinutes, totalServings, meal.starRating);
}

export function mapEmptyMealSlot(slotIndex: number): ContentCardListItem {
  return {
    id: `slot-${slotIndex}`,
    compactCategoryLabel: true,
    title: 'Tap to pick a meal',
    lucideIcon: 'utensils-crossed',
    iconBackgroundColor: EMPTY_MEAL_AVATAR_BG,
    imageOnMutedBackground: true,
    ...LIST_AVATAR,
  };
}

export function mapPlanMealToListItem(
  meal: PlanMeal,
  slotIndex: number,
  householdSize = 2,
  weekServingDelta = 0
): ContentCardListItem {
  const recipe = meal.recipe;
  if (!recipe) {
    return mapEmptyMealSlot(slotIndex);
  }

  const totalServings = householdSize + weekServingDelta + meal.extraGuests;
  return {
    id: `slot-${slotIndex}`,
    compactCategoryLabel: true,
    title: recipe.title,
    ...buildMealListDetail(meal, recipe, totalServings),
    imageUrl: recipe.imageUrl,
    ...LIST_AVATAR,
  };
}

export function mapCachedRecipeToListItem(
  recipe: CachedRecipe,
  options?: { id?: string; starRating?: number }
): ContentCardListItem {
  return {
    id: options?.id ?? String(recipe.id ?? recipe.spoonacularId),
    compactCategoryLabel: true,
    title: recipe.title,
    ...buildRecipeListDetail(recipe.readyInMinutes, undefined, options?.starRating),
    imageUrl: recipe.imageUrl,
    ...LIST_AVATAR,
  };
}

export function mapSpoonacularResultToListItem(
  result: SpoonacularSearchResult,
  options?: { starRating?: number }
): ContentCardListItem {
  return {
    id: String(result.id),
    compactCategoryLabel: true,
    title: result.title,
    ...buildRecipeListDetail(result.readyInMinutes, undefined, options?.starRating),
    imageUrl: result.image,
    ...LIST_AVATAR,
  };
}

export function mapSummaryMealToListItem(
  meal: PlanMeal,
  householdSize = 2,
  weekServingDelta = 0
): ContentCardListItem {
  const recipe = meal.recipe;
  const totalServings = householdSize + weekServingDelta + meal.extraGuests;
  return {
    id: String(meal.id),
    title: recipe?.title ?? 'Meal',
    ...(recipe ? buildMealListDetail(meal, recipe, totalServings) : {}),
    imageUrl: recipe?.imageUrl,
    clickable: false,
    ...LIST_AVATAR,
  };
}

export function mapGroceryItemToListItem(item: GroceryItem): ContentCardListItem {
  return {
    id: String(item.id),
    title: item.ingredientName,
    iconName: 'cart-outline',
    iconBackgroundColor: '#8b7355',
    avatarOverlayIcon: item.isChecked ? 'checkmark-circle' : undefined,
    ...LIST_AVATAR,
  };
}
