import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WeekPlanService } from './week-plan.service';
import { calculateWeekSummary } from '../utils/calculate-week-summary';
import type { WeekPlan, WeekSummary } from '../types/week-plan.types';

/**
 * Snapshot of current week budget data for home page widget.
 * Returned when user has a week plan for the current week.
 */
export interface SimpleBudgetHomeSnapshot {
  plan: WeekPlan;
  summary: WeekSummary;
}

/**
 * Service for exposing Simple Budget data to the host app (e.g. home page widget).
 * Returns current week snapshot only when user has data; null otherwise.
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleBudgetHomeService {
  constructor(private weekPlanService: WeekPlanService) {}

  /**
   * Gets the current week's budget snapshot for display on the home page.
   * Returns null if no plan exists for the current week.
   */
  getCurrentWeekSnapshot(): Observable<SimpleBudgetHomeSnapshot | null> {
    return from(this.fetchSnapshot()).pipe(
      catchError(() => of(null))
    );
  }

  private async fetchSnapshot(): Promise<SimpleBudgetHomeSnapshot | null> {
    // Use Sunday (0) to match the weekly budget page
    const weekStart = this.weekPlanService.getWeekStartForDate(new Date(), 0);
    const plan = await this.weekPlanService.getWeekByDate(weekStart);
    if (!plan) return null;
    const summary = calculateWeekSummary(plan);
    return { plan, summary };
  }
}
