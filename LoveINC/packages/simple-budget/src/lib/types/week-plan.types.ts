/**
 * Week plan type definitions for Simple Budget
 */

import type { CategoryInstance } from './category.types';

export type WeekPlanStatus = 'draft' | 'saved';

export interface WeekPlan {
  id?: number;
  weekStartDate: string; // YYYY-MM-DD
  startingBalance: number;
  categoryInstances: CategoryInstance[];
  notes?: string;
  /** Quick Adjust strategy notes (1-3 selected items) */
  strategyNotes?: string;
  /** Weekly Review prompts */
  reviewWhatChanged?: string;
  reviewNewMoney?: string;
  reviewBillsHigher?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  status: WeekPlanStatus;
}

export interface WeekSummary {
  totalAvailable: number;
  totalBills: number;
  totalFlexible: number;
  remaining: number;
  daysLeftInWeek: number;
  safeToSpendPerDay: number;
  isOverPlan: boolean;
}

export interface ExportRow {
  label: string;
  value: string | number;
}
