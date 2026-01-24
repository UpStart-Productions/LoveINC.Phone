import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-onboarding-step2',
  templateUrl: './onboarding-step2.page.html',
  styleUrls: ['./onboarding-step2.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class OnboardingStep2Page {
  selectedOptions: Set<string> = new Set();

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {}

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
      // Store selections temporarily for step 3
      const selectionsArray = Array.from(this.selectedOptions);
      console.log('Saving to sessionStorage:', selectionsArray);
      sessionStorage.setItem('loveinc_temp_selections', JSON.stringify(selectionsArray));
      this.router.navigate(['/onboarding/step3']);
    }
  }

  onExploring() {
    this.onboardingService.skipOnboarding();
    this.router.navigate(['/tabs']);
  }
}
