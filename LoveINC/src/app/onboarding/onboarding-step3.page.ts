import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonList,
} from '@ionic/angular/standalone';
import { OnboardingService, OnboardingData } from '../services/onboarding.service';
import { UserProfileService } from '../services/user-profile.service';
import { UserProfileFormComponent, type UserProfileFormValue } from '../components/user-profile-form/user-profile-form.component';

@Component({
  selector: 'app-onboarding-step3',
  templateUrl: './onboarding-step3.page.html',
  styleUrls: ['./onboarding-step3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonList,
    UserProfileFormComponent,
  ]
})
export class OnboardingStep3Page {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  wantsNewsletter: boolean = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService
  ) {}

  onFormSave(value: UserProfileFormValue) {
    this.firstName = value.firstName;
    this.lastName = value.lastName;
    this.email = value.email;

    // Get selections from step 2
    const selectionsStr = sessionStorage.getItem('loveinc_temp_selections');
    const selections = selectionsStr ? JSON.parse(selectionsStr) : [];

    // Create onboarding data
    const data: OnboardingData = {
      selectedOptions: selections,
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      wantsNewsletter: this.wantsNewsletter
    };

    // Save and complete onboarding
    this.onboardingService.setOnboardingCompleted(data);
    this.userProfileService.setProfile(value);

    // Clean up temporary storage
    sessionStorage.removeItem('loveinc_temp_selections');

    // Navigate to main app
    this.router.navigate(['/tabs']);
  }

  onSkip() {
    this.onboardingService.skipOnboarding();
    this.router.navigate(['/tabs']);
  }

  toggleNewsletter() {
    this.wantsNewsletter = !this.wantsNewsletter;
  }
}
