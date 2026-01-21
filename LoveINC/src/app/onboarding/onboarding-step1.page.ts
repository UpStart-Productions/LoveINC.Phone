import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmark, handRightOutline, heartOutline, giftOutline, arrowForwardOutline } from 'ionicons/icons';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-onboarding-step1',
  templateUrl: './onboarding-step1.page.html',
  styleUrls: ['./onboarding-step1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class OnboardingStep1Page {
  selectedOptions: Set<string> = new Set();

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {
    addIcons({ checkmark, handRightOutline, heartOutline, giftOutline, arrowForwardOutline });
  }

  toggleOption(option: string) {
    if (this.selectedOptions.has(option)) {
      this.selectedOptions.delete(option);
      console.log('Removed option:', option);
    } else {
      this.selectedOptions.add(option);
      console.log('Added option:', option);
    }
    console.log('Current selections:', Array.from(this.selectedOptions));
  }

  isSelected(option: string): boolean {
    return this.selectedOptions.has(option);
  }

  canProceed(): boolean {
    return this.selectedOptions.size > 0;
  }

  onNext() {
    if (this.canProceed()) {
      // Store selections temporarily for step 2
      const selectionsArray = Array.from(this.selectedOptions);
      console.log('Saving to sessionStorage:', selectionsArray);
      sessionStorage.setItem('loveinc_temp_selections', JSON.stringify(selectionsArray));
      this.router.navigate(['/onboarding/step2']);
    }
  }

  onExploring() {
    this.onboardingService.skipOnboarding();
    this.router.navigate(['/tabs']);
  }
}
