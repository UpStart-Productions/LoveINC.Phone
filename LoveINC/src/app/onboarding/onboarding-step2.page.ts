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
  IonCheckbox
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';
import { OnboardingService, OnboardingData } from '../services/onboarding.service';

@Component({
  selector: 'app-onboarding-step2',
  templateUrl: './onboarding-step2.page.html',
  styleUrls: ['./onboarding-step2.page.scss'],
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
    IonCheckbox
  ]
})
export class OnboardingStep2Page {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  wantsNewsletter: boolean = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {
    addIcons({ checkmarkOutline });
  }

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
      // Get selections from step 1
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
}
