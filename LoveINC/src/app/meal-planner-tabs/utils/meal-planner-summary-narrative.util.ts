import type { MealRecapThumb, PlanMeal } from '@upstart-productions/meal-planner';

type ComparisonPhrase = 'less' | 'more' | 'about the right amount';

function summarizeDimension(
  meals: readonly PlanMeal[],
  key: 'timeRating' | 'costRating'
): ComparisonPhrase | null {
  const rated = meals.filter((meal) => meal[key]);
  if (!rated.length) {
    return null;
  }

  let up = 0;
  let down = 0;
  for (const meal of rated) {
    const rating = meal[key] as MealRecapThumb;
    if (rating === 'up') {
      up++;
    } else if (rating === 'down') {
      down++;
    }
  }

  if (up > down) {
    return 'less';
  }
  if (down > up) {
    return 'more';
  }
  return 'about the right amount';
}

function formatTimePhrase(comparison: ComparisonPhrase): string {
  if (comparison === 'about the right amount') {
    return 'about the right amount of time';
  }
  return `${comparison} time`;
}

function formatCostPhrase(comparison: ComparisonPhrase): string {
  return comparison;
}

export function buildMealRecapNarrative(meals: readonly PlanMeal[]): string | null {
  const cooked = meals.filter((meal) => meal.isCooked);
  if (!cooked.length) {
    return null;
  }

  const timeComparison = summarizeDimension(cooked, 'timeRating');
  const costComparison = summarizeDimension(cooked, 'costRating');
  if (!timeComparison && !costComparison) {
    return null;
  }

  if (timeComparison && costComparison) {
    return `Your meals took ${formatTimePhrase(timeComparison)} and cost ${formatCostPhrase(costComparison)} than anticipated.`;
  }

  if (timeComparison) {
    return `Your meals took ${formatTimePhrase(timeComparison)} than anticipated.`;
  }

  return `Your meals cost ${formatCostPhrase(costComparison!)} than anticipated.`;
}
