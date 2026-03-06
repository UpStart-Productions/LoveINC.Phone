import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { OnboardingService } from '../services/onboarding.service';
import { PlatformApiService } from '../services/platform/platform-api.service';
import { DeviceIdService } from '../services/device-id.service';

@Component({
  selector: 'app-assistance-signup',
  templateUrl: './assistance-signup.page.html',
  styleUrls: ['./assistance-signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonCheckbox,
  ],
})
export class AssistanceSignupPage implements OnInit {
  form = {
    firstName: '',
    lastName: '',
    city: '',
    phone: '',
    email: '',
    reason: '',
    comments: '',
    wantsNewsletter: false,
  };

  submitting = false;

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private platformApi: PlatformApiService,
    private deviceId: DeviceIdService,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    const data = this.onboardingService.getOnboardingData();
    if (data?.firstName) this.form.firstName = data.firstName;
    if (data?.lastName) this.form.lastName = data.lastName;
    if (data?.email) this.form.email = data.email;
    if (data?.wantsNewsletter != null) this.form.wantsNewsletter = data.wantsNewsletter;
  }

  canSubmit(): boolean {
    return !!(
      this.form.firstName.trim() &&
      this.form.lastName.trim() &&
      this.form.city &&
      this.form.email.trim() &&
      this.form.reason
    );
  }

  async onSubmit() {
    if (!this.canSubmit() || this.submitting) return;
    this.submitting = true;
    try {
      await this.platformApi.postPreIntake({
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone?.trim() || undefined,
        city: this.form.city,
        reason: this.form.reason,
        comments: this.form.comments?.trim() || undefined,
        deviceId: this.deviceId.getDeviceId(),
        newsletterOptIn: this.form.wantsNewsletter,
        textOptIn: false,
      });
      this.router.navigate(['/assistance/thank-you']);
    } catch (err) {
      const msg = (err as { error?: { message?: string }; message?: string })?.error?.message
        ?? (err as { message?: string })?.message
        ?? 'Something went wrong. Please try again.';
      const toast = await this.toastController.create({
        message: msg,
        duration: 4000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle',
      });
      await toast.present();
    } finally {
      this.submitting = false;
    }
  }
}
