/**
 * Goal Tracker type definitions
 */

export type GoalCategory =
  | 'Spiritual'
  | 'Health'
  | 'Financial'
  | 'Community'
  | 'Service'
  | 'Other';

export interface Goal {
  id?: number;
  title: string;
  description?: string;
  /** Current progress value (e.g. 100 for $100 saved). Auto-updated by habit completions. */
  progress: number;
  /** Target value (e.g. 1000 for $1000). Optional. */
  target?: number;
  color?: string;
  category?: GoalCategory;
  dueDate?: string; // ISO date string
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
}
