import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCheckbox,
  IonButton,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { OnboardingService } from '../../services/onboarding.service';
import { UserProfileService } from '../../services/user-profile.service';
import { PlatformApiService } from '../../services/platform/platform-api.service';
import { DeviceIdService } from '../../services/device-id.service';
import {
  PhoneFormatterDirective,
  EmailValidatorDirective,
  PhoneValidatorDirective,
} from '../../shared/validators';

@Component({
  selector: 'app-contact-assistance-form',
  templateUrl: './contact-assistance-form.component.html',
  styleUrls: ['./contact-assistance-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonCheckbox,
    IonButton,
    PhoneFormatterDirective,
    EmailValidatorDirective,
    PhoneValidatorDirective,
  ],
})
export class ContactAssistanceFormComponent implements OnInit {
  @Output() submitted = new EventEmitter<void>();

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
    private onboardingService: OnboardingService,
    private userProfile: UserProfileService,
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
    if (
      !this.form.firstName.trim() ||
      !this.form.lastName.trim() ||
      !this.form.city ||
      !this.form.phone?.trim() ||
      !this.form.email.trim() ||
      !this.form.reason
    ) {
      return false;
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(this.form.email.trim());
    if (!emailValid) return false;
    const digits = this.form.phone.replace(/\D/g, '');
    if (digits.length !== 10) return false;
    return true;
  }

  getEmailError(control: unknown): string {
    const c = control as { errors?: Record<string, { message?: string }> | null; invalid?: boolean; touched?: boolean };
    if (!c?.invalid || !c?.touched) return '';
    return c.errors?.['email']?.message ?? 'Please enter a valid email address';
  }

  getPhoneError(control: unknown): string {
    const c = control as { errors?: Record<string, { message?: string }> | null; invalid?: boolean; touched?: boolean };
    if (!c?.invalid || !c?.touched) return '';
    return c.errors?.['phone']?.message ?? 'Phone must be 10 digits';
  }

  async onSubmit() {
    if (!this.canSubmit() || this.submitting) return;
    this.submitting = true;
    try {
      const phoneDigits = this.form.phone?.replace(/\D/g, '');
      await this.platformApi.postPreIntake({
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        phone: phoneDigits && phoneDigits.length === 10 ? phoneDigits : undefined,
        city: this.form.city,
        reason: this.form.reason,
        comments: this.form.comments?.trim() || undefined,
        deviceId: this.deviceId.getDeviceId(),
        newsletterOptIn: this.form.wantsNewsletter,
        textOptIn: false,
      });
      this.userProfile.setProfile({
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
      });
      this.submitted.emit();
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
