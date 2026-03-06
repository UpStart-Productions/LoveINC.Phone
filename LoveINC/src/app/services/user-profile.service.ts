import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfileInfo {
  email: string;
  firstName?: string;
  lastName?: string;
}

const STORAGE_KEY = 'loveinc_user_profile';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private profile$ = new BehaviorSubject<UserProfileInfo>(this.loadFromStorage());

  private loadFromStorage(): UserProfileInfo {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          email: parsed.email ?? '',
          firstName: parsed.firstName ?? '',
          lastName: parsed.lastName ?? '',
        };
      }
    } catch {
      // ignore
    }
    return { email: '', firstName: '', lastName: '' };
  }

  private saveToStorage(profile: UserProfileInfo): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  getProfile(): UserProfileInfo {
    return this.profile$.value;
  }

  getProfile$(): Observable<UserProfileInfo> {
    return this.profile$.asObservable();
  }

  setProfile(profile: Partial<UserProfileInfo>): void {
    const current = this.profile$.value;
    const next = {
      email: (profile.email ?? current.email) ?? '',
      firstName: (profile.firstName ?? current.firstName) ?? '',
      lastName: (profile.lastName ?? current.lastName) ?? '',
    };
    this.profile$.next(next);
    this.saveToStorage(next);
  }

  hasEmail(): boolean {
    return !!this.profile$.value.email?.trim();
  }

  /** True if firstName, lastName, and email are all present. */
  hasCompleteProfile(): boolean {
    const p = this.profile$.value;
    return !!(
      p.firstName?.trim() &&
      p.lastName?.trim() &&
      p.email?.trim()
    );
  }
}
