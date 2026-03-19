import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GoalTrackerDateService {
  private selectedDate$ = new BehaviorSubject<string>(
    new Date().toISOString().slice(0, 10)
  );
  private completedDatesSubject = new BehaviorSubject<string[]>([]);

  get selectedDate(): string {
    return this.selectedDate$.getValue();
  }

  set selectedDate(date: string) {
    this.selectedDate$.next(date);
  }

  get onSelectedDateChange() {
    return this.selectedDate$.asObservable();
  }

  set completedDates(dates: string[]) {
    this.completedDatesSubject.next(dates);
  }

  get completedDates(): string[] {
    return this.completedDatesSubject.getValue();
  }

  get completedDates$() {
    return this.completedDatesSubject.asObservable();
  }
}
