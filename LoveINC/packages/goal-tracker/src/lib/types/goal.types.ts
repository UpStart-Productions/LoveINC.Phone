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
  progress: number; // 0-100
  target?: number; // optional numeric target (e.g. "read 5 chapters" -> target 5)
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
