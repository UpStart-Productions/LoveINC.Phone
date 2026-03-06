import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppUserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  activities: { activityType: string; itemType: string | null; itemId: string | null }[];
  intakeCompleted: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppUserDataService {
  private data$ = new BehaviorSubject<AppUserData | null>(null);

  getData(): AppUserData | null {
    return this.data$.value;
  }

  getData$(): Observable<AppUserData | null> {
    return this.data$.asObservable();
  }

  setData(data: AppUserData | null): void {
    this.data$.next(data);
  }

  clear(): void {
    this.data$.next(null);
  }

  /** True if we have a user with email from the server. */
  hasServerUser(): boolean {
    return !!this.data$.value?.email?.trim();
  }

  /** True if intake has been completed (from QR scan). */
  hasIntakeCompleted(): boolean {
    return this.data$.value?.intakeCompleted ?? false;
  }
}
