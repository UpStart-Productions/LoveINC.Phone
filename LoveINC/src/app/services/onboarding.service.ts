import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Legacy profile fields from older onboarding builds; optional after welcome-only flow. */
export interface OnboardingData {
  firstName?: string;
  lastName?: string;
  email?: string;
  wantsNewsletter?: boolean;
  completedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly ONBOARDING_KEY = 'loveinc_onboarding_completed';
  private readonly ONBOARDING_DATA_KEY = 'loveinc_onboarding_data';
  private readonly onboardingJustCompletedSubject = new Subject<void>();

  /** Emits when welcome splash is completed. Used to schedule push registration. */
  readonly onboardingJustCompleted$ = this.onboardingJustCompletedSubject.asObservable();

  hasCompletedOnboarding(): boolean {
    return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
  }

  /** Mark welcome splash complete (first launch only). */
  setOnboardingCompleted(data?: OnboardingData): void {
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
    if (data) {
      data.completedAt = new Date().toISOString();
      localStorage.setItem(this.ONBOARDING_DATA_KEY, JSON.stringify(data));
    }
    this.onboardingJustCompletedSubject.next();
  }

  getOnboardingData(): OnboardingData | null {
    const data = localStorage.getItem(this.ONBOARDING_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearOnboarding(): void {
    localStorage.removeItem(this.ONBOARDING_KEY);
    localStorage.removeItem(this.ONBOARDING_DATA_KEY);
    console.log('✅ Onboarding data cleared from localStorage');
  }

  getUserFirstName(): string | null {
    return this.getOnboardingData()?.firstName || null;
  }

  getUserFullName(): string | null {
    const data = this.getOnboardingData();
    if (data?.firstName && data?.lastName) {
      return `${data.firstName} ${data.lastName}`;
    }
    return null;
  }

  getUserEmail(): string | null {
    return this.getOnboardingData()?.email || null;
  }

  wantsNewsletter(): boolean {
    return this.getOnboardingData()?.wantsNewsletter || false;
  }

  updateOnboardingData(updates: Partial<OnboardingData>): void {
    const currentData = this.getOnboardingData() ?? {};
    const updatedData = { ...currentData, ...updates };
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
    localStorage.setItem(this.ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
  }
}
