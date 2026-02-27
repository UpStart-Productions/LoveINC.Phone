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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { OnboardingService } from '../../services/onboarding.service';
import { PlatformApiService } from '../../services/platform/platform-api.service';
import { DeviceInfoService } from '../../services/device-info.service';

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
    IonInput,
    IonItem,
    IonLabel,
    IonList,
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
    private platformApi: PlatformApiService,
    private deviceInfo: DeviceInfoService,
  ) {}

  hasUserInfo(): boolean {
    const data = this.onboardingService.getOnboardingData();
    return !!(data?.firstName?.trim() && data?.lastName?.trim() && data?.email?.trim());
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
      const data = this.onboardingService.getOnboardingData();
      this.firstName = data?.firstName ?? '';
      this.lastName = data?.lastName ?? '';
      this.email = data?.email ?? '';
    }
  }

  async onSubmitForm() {
    if (!this.selectedPosition || this.submitting) return;
    const fn = this.firstName.trim();
    const ln = this.lastName.trim();
    const em = this.email.trim();
    if (!fn || !ln || !em || !this.isValidEmail(em)) {
      await this.showToast('Please enter a valid first name, last name, and email.', 'danger');
      return;
    }
    this.submitting = true;
    this.onboardingService.updateOnboardingData({ firstName: fn, lastName: ln, email: em });
    await this.submitAndDismiss(this.selectedPosition);
    this.submitting = false;
  }

  onCancelForm() {
    this.showForm = false;
    this.selectedPosition = null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    return this.onboardingService.getUserFirstName() ?? '';
  }

  private getLastName(): string {
    if (this.showForm) return this.lastName.trim();
    const data = this.onboardingService.getOnboardingData();
    return data?.lastName?.trim() ?? '';
  }

  private getEmail(): string {
    if (this.showForm) return this.email.trim();
    return this.onboardingService.getUserEmail() ?? '';
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
