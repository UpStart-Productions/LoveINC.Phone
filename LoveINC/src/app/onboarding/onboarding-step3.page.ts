import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonList
} from '@ionic/angular/standalone';
import { OnboardingService, OnboardingData } from '../services/onboarding.service';

@Component({
  selector: 'app-onboarding-step3',
  templateUrl: './onboarding-step3.page.html',
  styleUrls: ['./onboarding-step3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonList
  ]
})
export class OnboardingStep3Page {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  wantsNewsletter: boolean = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {}

  canComplete(): boolean {
    return this.firstName.trim().length > 0 && 
           this.lastName.trim().length > 0 && 
           this.email.trim().length > 0 &&
           this.isValidEmail(this.email);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onComplete() {
    if (this.canComplete()) {
      // Get selections from step 2
      const selectionsStr = sessionStorage.getItem('loveinc_temp_selections');
      const selections = selectionsStr ? JSON.parse(selectionsStr) : [];

      // Create onboarding data
      const data: OnboardingData = {
        selectedOptions: selections,
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email: this.email.trim(),
        wantsNewsletter: this.wantsNewsletter
      };

      // Save and complete onboarding
      this.onboardingService.setOnboardingCompleted(data);

      // Clean up temporary storage
      sessionStorage.removeItem('loveinc_temp_selections');

      // Navigate to main app
      this.router.navigate(['/tabs']);
    }
  }

  onSkip() {
    this.onboardingService.skipOnboarding();
    this.router.navigate(['/tabs']);
  }

  toggleNewsletter() {
    this.wantsNewsletter = !this.wantsNewsletter;
  }
}
