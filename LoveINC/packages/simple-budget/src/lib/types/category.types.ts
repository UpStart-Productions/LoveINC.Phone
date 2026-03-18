/**
 * Category type definitions for Simple Budget
 */

export type CategoryType = 'income' | 'bills' | 'flexible';

/** Pre-seeded template category (used for default category list) */
export interface CategoryTemplate {
  id: string;
  name: string;
  type: CategoryType;
  sortOrder: number;
}

/** Category instance for a specific week (can be hidden, custom) */
export interface CategoryInstance {
  id?: number;
  weekPlanId: number;
  name: string;
  type: CategoryType;
  amount: number;
  /** Hidden for this week only (not deleted) */
  visible: boolean;
  /** User-added custom category (not from template) */
  isCustom: boolean;
  sortOrder: number;
}
