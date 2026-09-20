import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WeekPlanService } from './week-plan.service';
import { calculateWeekSummary } from '../utils/calculate-week-summary';
import { weekPlanHasBudgetContent } from '../utils/week-plan-has-content';
import type { WeekPlan, WeekSummary } from '../types/week-plan.types';

/**
 * Snapshot of budget data for the home page widget.
 * Uses the current week when it has entries; otherwise the most recent week with data.
 */
export interface SimpleBudgetHomeSnapshot {
  plan: WeekPlan;
  summary: WeekSummary;
}

/**
 * Service for exposing Simple Budget data to the host app (e.g. home page widget).
 * Returns null only when the user has no entered budget data in any week.
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleBudgetHomeService {
  constructor(private weekPlanService: WeekPlanService) {}

  /**
   * Gets a budget snapshot for the home page widget.
   * Prefers the current week; falls back to the latest week with entered budget data.
   */
  getCurrentWeekSnapshot(): Observable<SimpleBudgetHomeSnapshot | null> {
    return from(this.fetchSnapshot()).pipe(
      catchError(() => of(null))
    );
  }

  private async fetchSnapshot(): Promise<SimpleBudgetHomeSnapshot | null> {
    const plan = await this.resolveHomeWeekPlan();
    if (!plan) return null;
    return { plan, summary: calculateWeekSummary(plan) };
  }

  private async resolveHomeWeekPlan(): Promise<WeekPlan | null> {
    // Use Sunday (0) to match the weekly budget page
    const weekStart = this.weekPlanService.getWeekStartForDate(new Date(), 0);
    const currentPlan = await this.weekPlanService.getWeekByDate(weekStart);
    if (currentPlan && weekPlanHasBudgetContent(currentPlan)) {
      return currentPlan;
    }

    const weeks = await this.weekPlanService.listWeeks();
    return weeks.find((week) => weekPlanHasBudgetContent(week)) ?? null;
  }
}
