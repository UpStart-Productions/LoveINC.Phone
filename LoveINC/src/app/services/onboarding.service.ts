import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface OnboardingData {
  selectedOptions: string[];
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

  /** Emits when onboarding is marked complete (finish flow or skip). Used to schedule push registration. */
  readonly onboardingJustCompleted$ = this.onboardingJustCompletedSubject.asObservable();

  constructor() {}

  /**
   * Check if user has completed onboarding
   */
  hasCompletedOnboarding(): boolean {
    return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
  }

  /**
   * Mark onboarding as completed
   */
  setOnboardingCompleted(data?: OnboardingData): void {
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
    if (data) {
      data.completedAt = new Date().toISOString();
      localStorage.setItem(this.ONBOARDING_DATA_KEY, JSON.stringify(data));
    }
    this.onboardingJustCompletedSubject.next();
  }

  /**
   * Get onboarding data if available
   */
  getOnboardingData(): OnboardingData | null {
    const data = localStorage.getItem(this.ONBOARDING_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear onboarding data (for testing purposes)
   */
  clearOnboarding(): void {
    // Remove all onboarding-related keys from localStorage
    localStorage.removeItem(this.ONBOARDING_KEY);
    localStorage.removeItem(this.ONBOARDING_DATA_KEY);
    
    // Ensure keys are completely removed (defensive programming)
    try {
      if (localStorage.getItem(this.ONBOARDING_KEY)) {
        localStorage.removeItem(this.ONBOARDING_KEY);
      }
      if (localStorage.getItem(this.ONBOARDING_DATA_KEY)) {
        localStorage.removeItem(this.ONBOARDING_DATA_KEY);
      }
    } catch (e) {
      console.warn('Error clearing onboarding data:', e);
    }
    
    console.log('✅ Onboarding data cleared from localStorage');
  }

  /**
   * Skip onboarding (user clicks "I'm just exploring")
   */
  skipOnboarding(): void {
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
    const data: OnboardingData = {
      selectedOptions: ['exploring'],
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(this.ONBOARDING_DATA_KEY, JSON.stringify(data));
    this.onboardingJustCompletedSubject.next();
  }

  /**
   * Get user's first name
   */
  getUserFirstName(): string | null {
    const data = this.getOnboardingData();
    return data?.firstName || null;
  }

  /**
   * Get user's full name
   */
  getUserFullName(): string | null {
    const data = this.getOnboardingData();
    if (data?.firstName && data?.lastName) {
      return `${data.firstName} ${data.lastName}`;
    }
    return null;
  }

  /**
   * Get user's email
   */
  getUserEmail(): string | null {
    const data = this.getOnboardingData();
    return data?.email || null;
  }

  /**
   * Check if user wants newsletter
   */
  wantsNewsletter(): boolean {
    const data = this.getOnboardingData();
    return data?.wantsNewsletter || false;
  }

  /**
   * Get user's selected options
   */
  getSelectedOptions(): string[] {
    const data = this.getOnboardingData();
    return data?.selectedOptions || [];
  }

  /**
   * Check if user selected a specific option
   */
  hasSelectedOption(option: string): boolean {
    const options = this.getSelectedOptions();
    return options.includes(option);
  }

  /**
   * Check if user is exploring (skipped onboarding)
   */
  isExploring(): boolean {
    return this.hasSelectedOption('exploring');
  }

  /**
   * User chose "Get Help" (client path). Intake / service access flows apply.
   * Volunteer-only, Give-only, or exploring users are not on this path.
   */
  selectedGetHelpOnboarding(): boolean {
    return this.hasSelectedOption('get-help');
  }

  /**
   * Volunteer signup UI (card icons, action sheets, detail Volunteer buttons).
   * Hidden for Get Help clients; browse-only entry points (e.g. Open Volunteer Positions) stay available.
   */
  canShowVolunteerRequestUi(): boolean {
    return !this.selectedGetHelpOnboarding();
  }

  /**
   * Update specific onboarding data fields
   */
  updateOnboardingData(updates: Partial<OnboardingData>): void {
    const currentData = this.getOnboardingData() ?? { selectedOptions: [] };
    const updatedData = { ...currentData, ...updates };
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
    localStorage.setItem(this.ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
  }
}
