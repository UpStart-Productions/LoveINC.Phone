import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getCurrentWeekStart } from '@upstart-productions/meal-planner';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerStateService {
  private readonly selectedWeekStart$ = new BehaviorSubject<string>(getCurrentWeekStart());

  getSelectedWeekStart(): string {
    return this.selectedWeekStart$.value;
  }

  watchSelectedWeekStart() {
    return this.selectedWeekStart$.asObservable();
  }

  setSelectedWeekStart(weekStartDate: string) {
    this.selectedWeekStart$.next(weekStartDate);
  }
}
