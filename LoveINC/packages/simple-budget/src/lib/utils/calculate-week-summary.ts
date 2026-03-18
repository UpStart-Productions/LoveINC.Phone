/**
 * Pure function to calculate week summary from a week plan
 */

import type { WeekPlan, WeekSummary } from '../types/week-plan.types';
import type { CategoryInstance } from '../types/category.types';
import { addDays, differenceInDays, isAfter, startOfDay } from 'date-fns';

export function calculateWeekSummary(
  weekPlan: WeekPlan,
  asOfDate?: string // YYYY-MM-DD, defaults to today
): WeekSummary {
  const visible = (c: CategoryInstance) => c.visible;
  const income = weekPlan.categoryInstances
    .filter((c) => c.type === 'income' && visible(c))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const bills = weekPlan.categoryInstances
    .filter((c) => c.type === 'bills' && visible(c))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const flexible = weekPlan.categoryInstances
    .filter((c) => c.type === 'flexible' && visible(c))
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const totalAvailable = weekPlan.startingBalance + income;
  const totalBills = bills;
  const totalFlexible = flexible;
  const remaining = totalAvailable - totalBills - totalFlexible;

  const weekStart = new Date(weekPlan.weekStartDate + 'T00:00:00');
  const weekEnd = addDays(weekStart, 6);
  const today = asOfDate
    ? new Date(asOfDate + 'T00:00:00')
    : startOfDay(new Date());
  const daysLeftInWeek =
    today > weekEnd
      ? 0
      : today < weekStart
        ? 7
        : Math.min(7, differenceInDays(weekEnd, today) + 1);

  const safeToSpendPerDay =
    daysLeftInWeek > 0 ? Math.round((remaining / daysLeftInWeek) * 100) / 100 : 0;

  return {
    totalAvailable,
    totalBills,
    totalFlexible,
    remaining,
    daysLeftInWeek,
    safeToSpendPerDay,
    isOverPlan: remaining < 0,
  };
}
