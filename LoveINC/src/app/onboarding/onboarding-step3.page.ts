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
import { PlatformApiService } from '../services/platform/platform-api.service';
import { DeviceIdService } from '../services/device-id.service';
import { DeviceInfoService } from '../services/device-info.service';
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
  submitting = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private platformApi: PlatformApiService,
    private deviceId: DeviceIdService,
    private deviceInfo: DeviceInfoService,
  ) {}

  async onFormSave(value: UserProfileFormValue) {
    this.firstName = value.firstName;
    this.lastName = value.lastName;
    this.email = value.email;

    if (this.submitting) return;
    this.submitting = true;

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

    // Save and complete onboarding locally first
    this.onboardingService.setOnboardingCompleted(data);
    this.userProfileService.setProfile(value);
    sessionStorage.removeItem('loveinc_temp_selections');

    // Register with API (non-blocking; user proceeds even if this fails)
    try {
      const { platform, model } = await this.deviceInfo.getDeviceInfo();
      await this.platformApi.registerAppUser({
        firstName: value.firstName?.trim(),
        lastName: value.lastName?.trim(),
        email: value.email?.trim(),
        deviceId: this.deviceId.getDeviceId(),
        devicePlatform: platform,
        deviceModel: model,
      });
    } catch (err) {
      console.warn('Onboarding: API register failed (continuing)', err);
    } finally {
      this.submitting = false;
    }

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
