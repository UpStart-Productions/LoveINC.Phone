/**
 * Habit and HabitCompletion type definitions
 */

/** Weekday schedule: { day: 'Monday', selected: true } */
export interface WeekdaySchedule {
  day: string;
  selected: boolean;
}

export interface Habit {
  id?: number;
  goalId: number;
  name: string;
  description?: string;
  color: string;
  /** JSON array of { day, selected } - which days habit is scheduled */
  schedule: WeekdaySchedule[];
  /** Amount added to goal progress when habit is completed (0 = no auto-update) */
  progressIncrement: number;
  reminderTime?: string; // "19:00"
  /** @internal DB only - habits have no date range in UI */
  startDate?: string;
  /** @internal DB only - habits have no date range in UI */
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt?: string;
}
