import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfileInfo {
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private profile$ = new BehaviorSubject<UserProfileInfo>({
    email: '',
    firstName: '',
    lastName: '',
  });

  getProfile(): UserProfileInfo {
    return this.profile$.value;
  }

  getProfile$(): Observable<UserProfileInfo> {
    return this.profile$.asObservable();
  }

  setProfile(profile: Partial<UserProfileInfo>): void {
    const current = this.profile$.value;
    this.profile$.next({
      email: profile.email ?? current.email,
      firstName: profile.firstName ?? current.firstName,
      lastName: profile.lastName ?? current.lastName,
    });
  }

  hasEmail(): boolean {
    return !!this.profile$.value.email?.trim();
  }
}
