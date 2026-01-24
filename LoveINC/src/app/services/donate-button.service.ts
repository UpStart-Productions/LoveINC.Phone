import { Injectable } from '@angular/core';
import { OnboardingService } from './onboarding.service';

@Injectable({
  providedIn: 'root'
})
export class DonateButtonService {
  constructor(private onboardingService: OnboardingService) {}

  shouldShowDonateButton(): boolean {
    const selectedOptions = this.onboardingService.getSelectedOptions();
    return selectedOptions.includes('volunteer') || selectedOptions.includes('give');
  }
}
