import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GoalService } from './goal.service';
import { HabitService } from './habit.service';
import type { Habit } from '../types/habit.types';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Snapshot for the home page widget: today's scheduled habits (incomplete goals only). */
export interface GoalTrackerHomeSnapshot {
  scheduledTotal: number;
  completedTotal: number;
}

/**
 * Exposes a single-day summary for the host app home page.
 * Returns null when the user has not created any goals (no tracker data).
 */
@Injectable({
  providedIn: 'root',
})
export class GoalTrackerHomeService {
  constructor(
    private goalService: GoalService,
    private habitService: HabitService
  ) {}

  getHomeSnapshot(): Observable<GoalTrackerHomeSnapshot | null> {
    return from(this.fetchSnapshot()).pipe(catchError(() => of(null)));
  }

  private async fetchSnapshot(): Promise<GoalTrackerHomeSnapshot | null> {
    const goals = await this.goalService.getAllGoals();
    if (!goals.length) {
      return null;
    }
    const todayStr = toLocalDateString(new Date());
    const allHabits = await this.habitService.getAllHabits();
    const byGoal = new Map<number, Habit[]>();
    for (const h of allHabits) {
      if (h.goalId == null) continue;
      const list = byGoal.get(h.goalId) ?? [];
      list.push(h);
      byGoal.set(h.goalId, list);
    }

    let scheduledTotal = 0;
    let completedTotal = 0;

    for (const goal of goals) {
      if (goal.completed) {
        continue;
      }
      const habits = byGoal.get(goal.id!) ?? [];
      for (const habit of habits) {
        if (!this.habitService.isHabitScheduledForDate(habit, todayStr)) {
          continue;
        }
        scheduledTotal += 1;
        const c = await this.habitService.getCompletion(habit.id!, todayStr);
        if (c?.completed) {
          completedTotal += 1;
        }
      }
    }

    return { scheduledTotal, completedTotal };
  }
}
