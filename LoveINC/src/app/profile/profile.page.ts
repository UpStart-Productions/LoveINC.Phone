import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { UserProfileService } from '../services/user-profile.service';
import { AppUserDataService } from '../services/app-user-data.service';
import { PlatformApiService } from '../services/platform/platform-api.service';
import { DeviceIdService } from '../services/device-id.service';
import { DeviceInfoService } from '../services/device-info.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { ServiceAccessSectionComponent } from '../../../packages/service-unlock/src/lib/components/service-access-section.component';
import type { Voucher } from '../../../packages/service-unlock/src/lib/types/service-unlock.types';
import { UserProfileFormModalComponent } from '../components/user-profile-form-modal/user-profile-form-modal.component';
import { VoucherDetailModalComponent } from '../components/voucher-detail-modal/voucher-detail-modal.component';
import { Subscription, firstValueFrom } from 'rxjs';

type UserType = 'client' | 'donor' | 'volunteer';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    ServiceAccessSectionComponent,
    IonHeader,
    IonRefresher,
    IonRefresherContent,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class ProfilePage implements OnInit, OnDestroy {
  selectedUserType: UserType = 'client';

  profileInfo = { email: '', firstName: '', lastName: '' };
  private profileSub?: Subscription;

  userProfile = {
    name: '',
    email: '',
  };

  emailVerifiedAt: string | null = null;
  profileVouchers: Voucher[] | null = null;
  profileIntakeCompleted = false;
  intakeRequired = true;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    readAt: string | null;
    createdAt: string;
    meta?: { voucherRequestId?: string; voucherId?: string; voucherTitle?: string };
  }> = [];

  // Client-specific data (used when My Engagement is re-enabled)
  clientData = {
    engagement: {
      classesCompleted: 2,
      servicesUsed: 5,
      progressGoals: 1,
      livesImpacted: 0
    }
  };

  // Donor-specific data
  donorData = {
    engagement: {
      totalDonated: 1250,
      donationsMade: 8,
      familiesHelped: 12,
      livesImpacted: 12
    }
  };

  // Volunteer-specific data
  volunteerData = {
    engagement: {
      volunteerHours: 45,
      eventsAttended: 8,
      familiesServed: 120,
      livesImpacted: 120
    }
  };

  constructor(
    private router: Router,
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private appUserData: AppUserDataService,
    private platformApi: PlatformApiService,
    private deviceId: DeviceIdService,
    private deviceInfo: DeviceInfoService,
    private modalController: ModalController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    const p = this.userProfileService.getProfile();
    this.profileInfo = { email: p.email ?? '', firstName: p.firstName ?? '', lastName: p.lastName ?? '' };
    this.profileSub = this.userProfileService.getProfile$().subscribe((prof) => {
      this.profileInfo = { email: prof.email ?? '', firstName: prof.firstName ?? '', lastName: prof.lastName ?? '' };
      this.updateDisplayProfile();
    });
    this.updateDisplayProfile();
    const appUser = this.appUserData.getData();
    if (appUser?.emailVerifiedAt) {
      this.emailVerifiedAt = appUser.emailVerifiedAt;
    }
    this.loadProfile();
  }

  ionViewWillEnter(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const deviceId = this.deviceId.getDeviceId();
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    this.platformApi.getClientAccess().subscribe({
      next: (res) => {
        this.intakeRequired = res?.intakeRequired ?? true;
      },
      error: () => {},
    });
    if (!deviceId && !email) return;
    this.platformApi.getAppUserProfile({ deviceId: deviceId || undefined, email: email || undefined }).subscribe({
      next: (res) => {
        if (res?.profile) {
          this.emailVerifiedAt = res.profile.emailVerifiedAt;
          this.profileIntakeCompleted = res.profile.intakeCompleted ?? false;
          this.profileVouchers = (res.profile.voucherRequests ?? []).map((vr) => ({
            id: vr.id,
            serviceId: vr.voucherId,
            serviceLabel: vr.voucherTitle,
            status: this.mapVoucherStatus(vr.status, vr.deniedAt, vr.expiresAt),
            requestedAt: vr.createdAt,
            approvedAt: vr.approvedAt ?? undefined,
            validUntil: vr.expiresAt ?? vr.createdAt,
            expiresAt: vr.expiresAt ?? undefined,
            providerOffering: vr.providerOffering ?? undefined,
            location: vr.location ?? undefined,
          }));
          this.notifications = (res.profile.notifications ?? []).map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            readAt: n.readAt,
            createdAt: n.createdAt,
            meta: n.meta as { voucherRequestId?: string; voucherId?: string; voucherTitle?: string } | undefined,
          }));
        }
      },
    });
  }

  async onRefresh(event: Event): Promise<void> {
    const refresher = (event as CustomEvent).target as HTMLIonRefresherElement;
    const deviceId = this.deviceId.getDeviceId();
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    if (deviceId || email) {
      try {
        const res = await firstValueFrom(
          this.platformApi.getAppUserProfile({ deviceId: deviceId || undefined, email: email || undefined })
        );
        if (res?.profile) {
          this.emailVerifiedAt = res.profile.emailVerifiedAt ?? null;
          this.profileIntakeCompleted = res.profile.intakeCompleted ?? false;
          this.profileVouchers = (res.profile.voucherRequests ?? []).map((vr) => ({
            id: vr.id,
            serviceId: vr.voucherId,
            serviceLabel: vr.voucherTitle,
            status: this.mapVoucherStatus(vr.status, vr.deniedAt, vr.expiresAt),
            requestedAt: vr.createdAt,
            approvedAt: vr.approvedAt ?? undefined,
            validUntil: vr.expiresAt ?? vr.createdAt,
            expiresAt: vr.expiresAt ?? undefined,
            providerOffering: vr.providerOffering ?? undefined,
            location: vr.location ?? undefined,
          }));
          this.notifications = (res.profile.notifications ?? []).map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            readAt: n.readAt,
            createdAt: n.createdAt,
            meta: n.meta as { voucherRequestId?: string; voucherId?: string; voucherTitle?: string } | undefined,
          }));
        }
      } catch {
        // Ignore
      }
    }
    refresher?.complete?.();
  }

  private mapVoucherStatus(status: string, deniedAt: string | null, expiresAt: string | null): 'pending' | 'approved' | 'expired' {
    if (deniedAt) return 'expired';
    if (status === 'approved') return 'approved';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
    return 'pending';
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  private updateDisplayProfile(): void {
    const p = this.profileInfo;
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || '';
    this.userProfile = {
      ...this.userProfile,
      name,
      email: p.email,
    };
  }

  get displayName(): string {
    return [this.profileInfo.firstName, this.profileInfo.lastName].filter(Boolean).join(' ') || '';
  }

  get apiIntakeCompleted(): boolean {
    return this.profileIntakeCompleted || this.appUserData.hasIntakeCompleted();
  }

  async editProfile(): Promise<void> {
    const modal = await this.modalController.create({
      component: UserProfileFormModalComponent,
      componentProps: {
        headerTitle: 'Your information',
        message: 'Email is required for intake validation.',
        firstName: this.profileInfo.firstName,
        lastName: this.profileInfo.lastName,
        email: this.profileInfo.email,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.userProfileService.setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
      await this.saveProfileToApi(data.firstName ?? '', data.lastName ?? '', data.email ?? '');
    }
  }

  private async saveProfileToApi(firstName: string, lastName: string, email: string): Promise<void> {
    try {
      const { platform, model } = await this.deviceInfo.getDeviceInfo();
      const wantsNewsletter = this.onboardingService.wantsNewsletter();
      await this.platformApi.registerAppUser({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        deviceId: this.deviceId.getDeviceId(),
        devicePlatform: platform,
        deviceModel: model,
        newsletterOptIn: wantsNewsletter,
      });
      this.platformApi
        .getAppUser({
          deviceId: this.deviceId.getDeviceId(),
          email: email.trim() || undefined,
        })
        .subscribe({
          next: (res) => {
            if (res?.user) {
              this.appUserData.setData(res.user);
            }
          },
        });
      this.loadProfile();
    } catch (err) {
      console.warn('Profile: save to API failed', err);
    }
  }

  onScanRequested = async (): Promise<void> => {
    if (this.userProfileService.hasCompleteProfile()) {
      this.router.navigate(['/tabs/service-unlock/scan']);
      return;
    }
    const modal = await this.modalController.create({
      component: UserProfileFormModalComponent,
      componentProps: {
        headerTitle: 'Complete your profile',
        message: 'Please enter your first name, last name, and email to scan the QR code.',
        firstName: this.profileInfo.firstName,
        lastName: this.profileInfo.lastName,
        email: this.profileInfo.email,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.userProfileService.setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
      this.router.navigate(['/tabs/service-unlock/scan']);
    }
  };

  get currentEngagement() {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement;
      case 'donor':
        return this.donorData.engagement;
      case 'volunteer':
        return this.volunteerData.engagement;
    }
  }

  get engagementLabels() {
    switch (this.selectedUserType) {
      case 'client':
        return {
          label1: 'Classes Completed',
          label2: 'Services Used',
          label3: 'Progress Goals',
          label4: 'Lives Impacted'
        };
      case 'donor':
        return {
          label1: 'Total Donated',
          label2: 'Donations Made',
          label3: 'Families Helped',
          label4: 'Lives Impacted'
        };
      case 'volunteer':
        return {
          label1: 'Volunteer Hours',
          label2: 'Events Attended',
          label3: 'Families Served',
          label4: 'Lives Impacted'
        };
    }
  }

  get engagementValue1(): number | string {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement.classesCompleted;
      case 'donor':
        return this.donorData.engagement.totalDonated;
      case 'volunteer':
        return this.volunteerData.engagement.volunteerHours;
    }
  }

  get engagementValue2(): number {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement.servicesUsed;
      case 'donor':
        return this.donorData.engagement.donationsMade;
      case 'volunteer':
        return this.volunteerData.engagement.eventsAttended;
    }
  }

  get engagementValue3(): number {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement.progressGoals;
      case 'donor':
        return this.donorData.engagement.familiesHelped;
      case 'volunteer':
        return this.volunteerData.engagement.familiesServed;
    }
  }

  get engagementValue4(): number {
    return this.currentEngagement.livesImpacted;
  }

  get isDonorValue1(): boolean {
    return this.selectedUserType === 'donor';
  }

  get showVerifyEmail(): boolean {
    return !!(
      this.userProfile.email?.trim() &&
      !this.emailVerifiedAt
    );
  }

  verifyingEmail = false;

  async sendVerifyEmail(): Promise<void> {
    const email = this.userProfile.email?.trim();
    if (!email || this.verifyingEmail) return;
    this.verifyingEmail = true;
    try {
      const res = await this.platformApi.sendMagicLink({
        purpose: 'verify',
        email,
        deviceId: this.deviceId.getDeviceId(),
      });
      if (res.sent) {
        const alert = await this.alertController.create({
          header: 'Check your email',
          message: 'We sent a verification link to ' + email + '. Click the link to verify your email.',
          buttons: ['OK'],
        });
        await alert.present();
      } else {
        const alert = await this.alertController.create({
          header: 'Could not send email',
          message: res.error ?? 'Please try again later.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Please check your connection and try again.';
      const alert = await this.alertController.create({
        header: 'Could not send email',
        message: msg,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.verifyingEmail = false;
    }
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.platformApi.markNotificationRead(notificationId, {
      deviceId: this.deviceId.getDeviceId(),
      email: this.userProfileService.getProfile().email?.trim(),
    });
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
    );
  }

  async onNotificationTap(n: (typeof this.notifications)[0]): Promise<void> {
    await this.markNotificationRead(n.id);
    if (n.type === 'voucher_approved' && n.meta?.voucherRequestId && this.profileVouchers?.length) {
      const voucher = this.profileVouchers.find((v) => v.id === n.meta!.voucherRequestId);
      if (voucher) {
        await this.openVoucherModal(voucher);
      }
    }
  }

  async openVoucherModal(voucher: Voucher): Promise<void> {
    const modal = await this.modalController.create({
      component: VoucherDetailModalComponent,
      componentProps: { voucher },
    });
    await modal.present();
  }

  navigateToSandbox() {
    this.router.navigate(['/sandbox']);
  }

  navigateToDeveloperOptions() {
    this.router.navigate(['/tabs/developer-options']);
  }
}
