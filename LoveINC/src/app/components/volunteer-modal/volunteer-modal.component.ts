import { Component, Input, OnInit } from '@angular/core';
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
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { UserProfileFormComponent, type UserProfileFormValue } from '../user-profile-form/user-profile-form.component';
import { OnboardingService } from '../../services/onboarding.service';
import { UserProfileService } from '../../services/user-profile.service';
import { PlatformApiService } from '../../services/platform/platform-api.service';
import { DeviceInfoService } from '../../services/device-info.service';
import { DeviceIdService } from '../../services/device-id.service';
import { LocationMapModalService } from '../../services/location-map-modal.service';

export interface VolunteerPosition {
  id: string;
  title?: string;
  shortDescription?: string;
  longDescription?: string;
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    UserProfileFormComponent,
    SafeHtmlPipe,
  ],
})
export class VolunteerModalComponent implements OnInit {
  @Input() organizationName = '';
  @Input() address: string | null = null;
  @Input() locationHours: string | null = null;
  @Input() positions: VolunteerPosition[] = [];

  showForm = false;
  selectedPosition: VolunteerPosition | null = null;
  firstName = '';
  lastName = '';
  email = '';
  wantsNewsletter = false;
  notReceivingServices = false;
  submitting = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private platformApi: PlatformApiService,
    private deviceInfo: DeviceInfoService,
    private deviceId: DeviceIdService,
    private locationMapModal: LocationMapModalService
  ) {}

  ngOnInit() {
    if (!this.hasUserInfo() && this.positions?.length > 0) {
      this.showForm = true;
      this.selectedPosition = this.positions[0];
      const profile = this.userProfileService.getProfile();
      const onboarding = this.onboardingService.getOnboardingData();
      this.firstName = profile.firstName ?? onboarding?.firstName ?? '';
      this.lastName = profile.lastName ?? onboarding?.lastName ?? '';
      this.email = profile.email ?? onboarding?.email ?? '';
      this.wantsNewsletter = onboarding?.wantsNewsletter ?? false;
    }
  }

  hasUserInfo(): boolean {
    return this.userProfileService.hasCompleteProfile() ||
      !!(this.onboardingService.getOnboardingData()?.firstName?.trim() &&
        this.onboardingService.getOnboardingData()?.lastName?.trim() &&
        this.onboardingService.getOnboardingData()?.email?.trim());
  }

  async dismiss() {
    await this.modalController.dismiss();
  }

  async openAddressOnMap(ev: Event): Promise<void> {
    ev.stopPropagation();
    const addr = this.address?.trim();
    if (!addr) return;
    await this.locationMapModal.present({
      title: this.organizationName,
      address: addr,
      hours: this.locationHours ?? null,
    });
  }

  async onVolunteer(position: VolunteerPosition) {
    if (!this.notReceivingServices) {
      await this.showToast('Please affirm that you are not currently receiving services from Love INC.', 'danger');
      return;
    }
    await this.submitAndDismiss(position);
  }

  async onSubmitForm(value: UserProfileFormValue) {
    if (!this.selectedPosition || this.submitting) return;
    if (!this.notReceivingServices) {
      await this.showToast('Please affirm that you are not currently receiving services from Love INC.', 'danger');
      return;
    }
    this.submitting = true;
    this.firstName = value.firstName;
    this.lastName = value.lastName;
    this.email = value.email;
    this.userProfileService.setProfile(value);
    this.onboardingService.updateOnboardingData({
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      wantsNewsletter: this.wantsNewsletter,
    });
    await this.submitAndDismiss(this.selectedPosition);
    this.submitting = false;
  }

  onCancelForm() {
    this.showForm = false;
    this.selectedPosition = null;
    this.dismiss();
  }

  onPositionChange(event: Event) {
    const ev = event as CustomEvent<{ value: string }>;
    const id = ev.detail?.value;
    if (id) {
      const pos = this.positions.find((p) => p.id === id);
      if (pos) this.selectedPosition = pos;
    }
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
