import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { UserProfileFormComponent, type UserProfileFormValue } from '../user-profile-form/user-profile-form.component';
import { OnboardingService } from '../../services/onboarding.service';
import { UserProfileService } from '../../services/user-profile.service';
import { PlatformApiService } from '../../services/platform/platform-api.service';
import { DeviceInfoService } from '../../services/device-info.service';
import { DeviceIdService } from '../../services/device-id.service';

export interface VolunteerPosition {
  id: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  schedule?: string;
}

@Component({
  selector: 'app-volunteer-modal',
  templateUrl: './volunteer-modal.component.html',
  styleUrls: ['./volunteer-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    UserProfileFormComponent,
    SafeHtmlPipe,
  ],
})
export class VolunteerModalComponent {
  @Input() organizationName = '';
  @Input() address: string | null = null;
  @Input() locationHours: string | null = null;
  @Input() positions: VolunteerPosition[] = [];

  showForm = false;
  selectedPosition: VolunteerPosition | null = null;
  firstName = '';
  lastName = '';
  email = '';
  submitting = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private platformApi: PlatformApiService,
    private deviceInfo: DeviceInfoService,
    private deviceId: DeviceIdService,
  ) {}

  hasUserInfo(): boolean {
    return this.userProfileService.hasCompleteProfile() ||
      !!(this.onboardingService.getOnboardingData()?.firstName?.trim() &&
        this.onboardingService.getOnboardingData()?.lastName?.trim() &&
        this.onboardingService.getOnboardingData()?.email?.trim());
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  async onVolunteer(position: VolunteerPosition) {
    if (this.hasUserInfo()) {
      await this.submitAndDismiss(position);
    } else {
      this.selectedPosition = position;
      this.showForm = true;
      const profile = this.userProfileService.getProfile();
      const onboarding = this.onboardingService.getOnboardingData();
      this.firstName = profile.firstName ?? onboarding?.firstName ?? '';
      this.lastName = profile.lastName ?? onboarding?.lastName ?? '';
      this.email = profile.email ?? onboarding?.email ?? '';
    }
  }

  async onSubmitForm(value: UserProfileFormValue) {
    if (!this.selectedPosition || this.submitting) return;
    this.submitting = true;
    this.firstName = value.firstName;
    this.lastName = value.lastName;
    this.email = value.email;
    this.userProfileService.setProfile(value);
    this.onboardingService.updateOnboardingData(value);
    await this.submitAndDismiss(this.selectedPosition);
    this.submitting = false;
  }

  onCancelForm() {
    this.showForm = false;
    this.selectedPosition = null;
  }

  private async submitAndDismiss(position: VolunteerPosition) {
    try {
      const { platform, model } = await this.deviceInfo.getDeviceInfo();
      await this.platformApi.postAppUserNotification({
        firstName: this.getFirstName(),
        lastName: this.getLastName(),
        email: this.getEmail(),
        devicePlatform: platform,
        deviceModel: model,
        itemType: 'volunteer_position',
        itemId: position.id,
        itemTitle: position.title ?? 'Volunteer',
        deviceId: this.deviceId.getDeviceId(),
      });
      await this.modalController.dismiss({ position });
      await this.showToast('Thanks! We\'ll be in touch about this volunteer opportunity.', 'success');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const msg = (err as { error?: { message?: string }; message?: string })?.error?.message
        ?? (err as { message?: string })?.message;
      console.error('Volunteer signup failed', err);
      const toastMsg = status
        ? `Request failed (${status}). ${msg ?? 'Please try again.'}`
        : 'Something went wrong. Please try again.';
      await this.showToast(toastMsg, 'danger');
    }
  }

  private getFirstName(): string {
    if (this.showForm) return this.firstName.trim();
    return this.userProfileService.getProfile().firstName ?? this.onboardingService.getUserFirstName() ?? '';
  }

  private getLastName(): string {
    if (this.showForm) return this.lastName.trim();
    return this.userProfileService.getProfile().lastName ?? this.onboardingService.getOnboardingData()?.lastName?.trim() ?? '';
  }

  private getEmail(): string {
    if (this.showForm) return this.email.trim();
    return this.userProfileService.getProfile().email ?? this.onboardingService.getUserEmail() ?? '';
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      icon: color === 'success' ? 'checkmark-circle' : 'alert-circle',
    });
    await toast.present();
  }
}
