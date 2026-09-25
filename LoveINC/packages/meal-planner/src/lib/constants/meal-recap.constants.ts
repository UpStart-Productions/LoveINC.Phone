export const MEAL_RECAP_REACTIONS = [
  { id: 'meh', emoji: '😐', label: 'Meh' },
  { id: 'good', emoji: '👍', label: 'Good' },
  { id: 'fantastic', emoji: '🤩', label: 'Fantastic!' },
] as const;

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
