export const MEAL_RECAP_REACTIONS = [
  { id: 'meh', emoji: '😐', label: 'Meh' },
  { id: 'good', emoji: '👍', label: 'Good' },
  { id: 'fantastic', emoji: '🤩', label: 'Fantastic!' },
] as const;

export type MealRecapThumb = 'up' | 'down';

export const MEAL_RECAP_RATING_DIMENSIONS = [
  { key: 'effort', label: 'Effort' },
  { key: 'time', label: 'Time' },
  { key: 'cost', label: 'Cost' },
] as const;

export type MealRecapRatingKey = (typeof MEAL_RECAP_RATING_DIMENSIONS)[number]['key'];

export type MealRecapComplexity = 'easy' | 'ok' | 'hard';

export const MEAL_RECAP_COMPLEXITY_VALUES: MealRecapComplexity[] = ['easy', 'ok', 'hard'];

export function complexityToIndex(value?: MealRecapComplexity): number {
  if (value === 'easy') {
    return 0;
  }
  if (value === 'hard') {
    return 2;
  }
  return 1;
}

export function indexToComplexity(index: number): MealRecapComplexity {
  if (index <= 0) {
    return 'easy';
  }
  if (index >= 2) {
    return 'hard';
  }
  return 'ok';
}

const REACTION_BASE_STARS: Record<(typeof MEAL_RECAP_REACTIONS)[number]['id'], number> = {
  meh: 2,
  good: 4,
  fantastic: 5,
};

export function computeMealStarRating(input: {
  reactionEmoji?: string;
  effortRating?: MealRecapThumb;
  timeRating?: MealRecapThumb;
  costRating?: MealRecapThumb;
}): number | undefined {
  const reaction = MEAL_RECAP_REACTIONS.find((row) => row.emoji === input.reactionEmoji);
  if (!reaction) {
    return undefined;
  }

  let score = REACTION_BASE_STARS[reaction.id];
  for (const thumb of [input.effortRating, input.timeRating, input.costRating]) {
    if (thumb === 'up') {
      score += 0.25;
    } else if (thumb === 'down') {
      score -= 0.25;
    }
  }

  const clamped = Math.min(5, Math.max(1, score));
  return Math.round(clamped * 10) / 10;
}
