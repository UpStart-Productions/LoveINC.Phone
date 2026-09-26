import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { getCurrentWeekStart } from '@upstart-productions/meal-planner';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerStateService {
  private readonly selectedWeekStart$ = new BehaviorSubject<string>(getCurrentWeekStart());
  private readonly weeklyPlanChanged$ = new Subject<string>();

  getSelectedWeekStart(): string {
    return this.selectedWeekStart$.value;
  }

  watchSelectedWeekStart() {
    return this.selectedWeekStart$.asObservable();
  }

  setSelectedWeekStart(weekStartDate: string) {
    this.selectedWeekStart$.next(weekStartDate);
  }

  watchWeeklyPlanChanged() {
    return this.weeklyPlanChanged$.asObservable();
  }

  notifyWeeklyPlanChanged(weekStartDate: string) {
    this.weeklyPlanChanged$.next(weekStartDate);
  }
}
