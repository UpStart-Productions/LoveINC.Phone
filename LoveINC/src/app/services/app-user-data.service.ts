import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppUserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  activities: { activityType: string; itemType: string | null; itemId: string | null }[];
  intakeCompleted: boolean;
}

const STORAGE_KEY = 'loveinc_app_user_data';

@Injectable({ providedIn: 'root' })
export class AppUserDataService {
  private data$ = new BehaviorSubject<AppUserData | null>(this.loadFromStorage());

  private loadFromStorage(): AppUserData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppUserData;
        if (parsed?.id) {
          return {
            id: parsed.id,
            firstName: parsed.firstName ?? null,
            lastName: parsed.lastName ?? null,
            email: parsed.email ?? null,
            emailVerifiedAt: parsed.emailVerifiedAt ?? null,
            activities: Array.isArray(parsed.activities) ? parsed.activities : [],
            intakeCompleted: !!parsed.intakeCompleted,
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private saveToStorage(data: AppUserData | null): void {
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  getData(): AppUserData | null {
    return this.data$.value;
  }

  getData$(): Observable<AppUserData | null> {
    return this.data$.asObservable();
  }

  setData(data: AppUserData | null): void {
    this.data$.next(data);
    this.saveToStorage(data);
  }

  clear(): void {
    this.data$.next(null);
    this.saveToStorage(null);
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
