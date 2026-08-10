import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { PlatformApiService } from '../services/platform/platform-api.service';
import { DeviceInfoService } from '../services/device-info.service';
import { DeviceIdService } from '../services/device-id.service';
import { OnboardingService } from '../services/onboarding.service';
import { UserProfileService } from '../services/user-profile.service';
import {
  SUPPORT_REQUEST_CATEGORIES,
  SupportRequestCategoryId,
} from './support-request.constants';

function supportRequestSubmitErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const status = err.status;
    const raw = err.error as { message?: string | string[] } | null | undefined;
    let serverMsg = '';
    if (raw && typeof raw === 'object' && 'message' in raw) {
      const m = raw.message;
      serverMsg = Array.isArray(m)
        ? m.map((x) => String(x).trim()).filter(Boolean).join(' ')
        : typeof m === 'string'
          ? m.trim()
          : '';
    }
    if (status === 404) {
      return 'Support submission is not available yet. Please try again later.';
    }
    if (status === 401 || status === 403) {
      return 'Your app could not be verified with the server. Please try again later or contact support.';
    }
    if (status === 0) {
      return 'Network error. Check your connection and try again.';
    }
    if (serverMsg) {
      return serverMsg;
    }
  }
  if (err instanceof Error && err.message === 'API key not configured') {
    return 'App configuration error. Please contact support.';
  }
  return 'Something went wrong. Please try again.';
}

@Component({
  selector: 'app-support-request',
  templateUrl: './support-request.page.html',
  styleUrls: ['./support-request.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    AppBackButtonComponent]})
export class SupportRequestPage implements OnInit {
  readonly categories = SUPPORT_REQUEST_CATEGORIES;

  name = '';
  selectedCategories = new Set<SupportRequestCategoryId>();
  details = '';
  submitting = false;

  constructor(
    private readonly router: Router,
    private readonly platformApi: PlatformApiService,
    private readonly deviceInfo: DeviceInfoService,
    private readonly deviceId: DeviceIdService,
    private readonly onboarding: OnboardingService,
    private readonly userProfile: UserProfileService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.name = this.buildPrefillName();
  }

  private buildPrefillName(): string {
    const profile = this.userProfile.getProfile();
    const first = profile.firstName?.trim();
    const last = profile.lastName?.trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    const onboard = this.onboarding.getOnboardingData();
    const of = onboard?.firstName?.trim();
    const ol = onboard?.lastName?.trim();
    if (of && ol) return `${of} ${ol}`;
    if (of) return of;
    return '';
  }

  toggleCategory(id: SupportRequestCategoryId): void {
    const next = new Set(this.selectedCategories);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedCategories = next;
  }

  isSelected(id: SupportRequestCategoryId): boolean {
    return this.selectedCategories.has(id);
  }

  get canSubmit(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.selectedCategories.size > 0 &&
      !this.submitting
    );
  }

  async ionViewWillEnter(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    } catch {
      // Keyboard plugin not available
    }
  }

  async ionViewWillLeave(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch {
      // Keyboard plugin not available
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit) return;
    this.submitting = true;
    try {
      const { platform, model } = await this.deviceInfo.getDeviceInfo();
      await this.platformApi.postSupportRequest({
        name: this.name.trim(),
        categoryIds: Array.from(this.selectedCategories),
        details: this.details.trim() || undefined,
        deviceId: this.deviceId.getDeviceId(),
        devicePlatform: platform,
        deviceModel: model});
      const toast = await this.toastController.create({
        message: 'Thanks — we received your request.',
        duration: 2500,
        position: 'bottom',
        color: 'success'});
      await toast.present();
      void this.router.navigate(['/tabs/more']);
    } catch (err: unknown) {
      const toast = await this.toastController.create({
        message: supportRequestSubmitErrorMessage(err),
        duration: 5500,
        position: 'bottom',
        color: 'danger'});
      await toast.present();
    } finally {
      this.submitting = false;
    }
  }
}
