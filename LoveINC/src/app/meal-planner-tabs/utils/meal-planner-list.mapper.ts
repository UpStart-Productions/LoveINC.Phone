import type { ContentCardListItem } from '../../components/content-card-list/content-card-list.model';
import type { CachedRecipe, GroceryItem, PlanMeal, SpoonacularSearchResult } from '@upstart-productions/meal-planner';

const LIST_AVATAR = { asideAvatarSize: 'large' as const };
const EMPTY_MEAL_AVATAR_BG = '#e0e0e0';

export function mapEmptyMealSlot(slotIndex: number): ContentCardListItem {
  return {
    id: `slot-${slotIndex}`,
    category: `Meal ${slotIndex + 1}`,
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
  const detailParts: string[] = [];
  if (recipe.readyInMinutes) {
    detailParts.push(`${recipe.readyInMinutes} min`);
  }
  const totalServings = householdSize + weekServingDelta + meal.extraGuests;
  detailParts.push(`Serves ${totalServings}`);
  return {
    id: `slot-${slotIndex}`,
    category: `Meal ${slotIndex + 1}`,
    compactCategoryLabel: true,
    title: recipe.title,
    detail: detailParts.length ? detailParts.join(' · ') : undefined,
    imageUrl: recipe.imageUrl,
    ...LIST_AVATAR,
  };
}

export function mapCachedRecipeToListItem(recipe: CachedRecipe, id?: string): ContentCardListItem {
  return {
    id: id ?? String(recipe.id ?? recipe.spoonacularId),
    title: recipe.title,
    detail: recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : undefined,
    imageUrl: recipe.imageUrl,
    ...LIST_AVATAR,
  };
}

export function mapSpoonacularResultToListItem(result: SpoonacularSearchResult): ContentCardListItem {
  return {
    id: String(result.id),
    title: result.title,
    detail: result.readyInMinutes ? `${result.readyInMinutes} min` : undefined,
    imageUrl: result.image,
    ...LIST_AVATAR,
  };
}

export function mapSummaryMealToListItem(
  meal: PlanMeal,
  detail?: string
): ContentCardListItem {
  const recipe = meal.recipe;
  return {
    id: String(meal.id),
    title: recipe?.title ?? 'Meal',
    detail,
    imageUrl: recipe?.imageUrl,
    clickable: false,
    ...LIST_AVATAR,
  };
}

export function mapGroceryItemToListItem(item: GroceryItem): ContentCardListItem {
  return {
    id: String(item.id),
    title: item.ingredientName,
    imageUrl: item.imageUrl,
    iconName: item.imageUrl ? undefined : 'cart-outline',
    iconBackgroundColor: '#8b7355',
    avatarOverlayIcon: item.isChecked ? 'checkmark-circle' : undefined,
    ...LIST_AVATAR,
  };
}
