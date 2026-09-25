export interface CookTimeOption {
  bucket: string;
  label: string;
}

export interface ReactionOption {
  emoji: string;
  label: string;
}

export const COOK_TIME_OPTIONS: CookTimeOption[] = [
  { bucket: 'under-30', label: 'Under 30 min' },
  { bucket: '30-45', label: '30–45 min' },
  { bucket: '45-60', label: '45–60 min' },
  { bucket: '60-plus', label: 'Over 60 min' },
];

export const REACTION_OPTIONS: ReactionOption[] = [
  { emoji: '😋', label: 'Loved it' },
  { emoji: '👍', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '👎', label: 'Not again' },
];

export const MEALS_PER_WEEK = 3;
