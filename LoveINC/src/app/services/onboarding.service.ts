import { Injectable } from '@angular/core';

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
    localStorage.removeItem(this.ONBOARDING_KEY);
    localStorage.removeItem(this.ONBOARDING_DATA_KEY);
    console.log('✅ Onboarding data cleared - refresh to see onboarding again');
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
  }
}
