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
  ) {}

  toggleOption(option: string) {
    if (this.selectedOptions.has(option)) {
      this.selectedOptions.delete(option);
    } else {
      this.selectedOptions.add(option);
    }
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
      sessionStorage.setItem('loveinc_temp_selections', JSON.stringify(Array.from(this.selectedOptions)));
      this.router.navigate(['/onboarding/step2']);
    }
  }

  onExploring() {
    this.onboardingService.skipOnboarding();
    this.router.navigate(['/tabs']);
  }
}
