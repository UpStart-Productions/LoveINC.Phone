import type { WeekPlan } from '../types/week-plan.types';

/** True when the user has entered budget data (not just an auto-created empty week). */
export function weekPlanHasBudgetContent(plan: WeekPlan): boolean {
  if (plan.startingBalance !== 0) {
    return true;
  }
  return plan.categoryInstances.some((c) => (c.amount ?? 0) !== 0);
}
