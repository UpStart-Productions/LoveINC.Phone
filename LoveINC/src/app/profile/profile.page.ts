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
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { ServiceAccessSectionComponent } from '../../../packages/service-unlock/src/lib/components/service-access-section.component';
import { VouchersPanelComponent } from '../../../packages/service-unlock/src/lib/components/vouchers-panel.component';
import type { Voucher } from '../../../packages/service-unlock/src/lib/types/service-unlock.types';
import { UserProfileFormModalComponent } from '../components/user-profile-form-modal/user-profile-form-modal.component';
import { VoucherDetailModalComponent } from '../components/voucher-detail-modal/voucher-detail-modal.component';
import { VoucherModalService } from '../services/voucher-modal.service';
import { DismissedVouchersService } from '../services/dismissed-vouchers.service';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    ServiceAccessSectionComponent,
    VouchersPanelComponent,
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
    IonLabel,
    AppBackButtonComponent]})
export class ProfilePage implements OnInit, OnDestroy {
  profileInfo = { email: '', firstName: '', lastName: '' };
  private profileSub?: Subscription;
  private dismissedSub?: Subscription;

  userProfile = {
    name: '',
    email: ''};

  emailVerifiedAt: string | null = null;
  profileVouchers: Voucher[] | null = null;
  profileVolunteerRequests: {
    id: string;
    itemTitle: string | null;
    completedAt: string | null;
  }[] | null = null;
  profileIntakeCompleted = false;
  volunteerActionLoading: string | null = null;
  intakeRequired = true;
  organizationName = 'Love INC';
  /** Customer name for Service Access (prefer over affiliate/org name). */
  customerName = 'Love INC';
  private dismissedIds = new Set<string>();
  private unlockSub?: Subscription;
  localIntakeUnlocked = false;

  constructor(
    private voucherModalService: VoucherModalService,
    private dismissedVouchers: DismissedVouchersService,
    private router: Router,
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private appUserData: AppUserDataService,
    private platformApi: PlatformApiService,
    private deviceId: DeviceIdService,
    private deviceInfo: DeviceInfoService,
    private modalController: ModalController,
    private alertController: AlertController,
    private serviceUnlock: ServiceUnlockService
  ) {}

  ngOnInit(): void {
    this.dismissedIds = this.dismissedVouchers.getDismissed();
    this.dismissedSub = this.dismissedVouchers.getDismissed$().subscribe((ids) => {
      this.dismissedIds = ids;
    });
    this.platformApi.getOrganization().subscribe({
      next: (org) => {
        if (org?.name) this.organizationName = org.name;
        const customerFromOrg = org?.customerName ?? org?.customer?.name;
        if (customerFromOrg) this.customerName = customerFromOrg;
      },
      error: () => {}});
    this.platformApi.getCustomer().subscribe({
      next: (customer) => {
        if (customer?.name) this.customerName = customer.name;
      },
      error: () => {}});
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
    void this.serviceUnlock.ensureInitialized().then(() => {
      this.localIntakeUnlocked = this.serviceUnlock.isUnlocked;
    });
    this.unlockSub = this.serviceUnlock.isUnlocked$.subscribe((u) => {
      this.localIntakeUnlocked = u;
    });
    this.loadProfile();
  }

  ionViewWillEnter(): void {
    void this.serviceUnlock.ensureInitialized().then(() => {
      this.localIntakeUnlocked = this.serviceUnlock.isUnlocked;
    });
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
      error: () => {}});
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
            status: this.mapVoucherStatus(vr.status, vr.deniedAt, vr.expiresAt, vr.redeemedAt),
            requestedAt: vr.createdAt,
            approvedAt: vr.approvedAt ?? undefined,
            validUntil: vr.expiresAt ?? vr.createdAt,
            expiresAt: vr.expiresAt ?? undefined,
            redeemedAt: vr.redeemedAt ?? undefined,
            shortDescription: vr.shortDescription ?? undefined,
            photoUrl: vr.photoUrl ? this.platformApi.resolveUploadUrl(vr.photoUrl) : undefined,
            providerOffering: vr.providerOffering ?? undefined,
            location: vr.location ?? undefined}));
          this.profileVolunteerRequests = (res.profile.volunteerRequests ?? []).map((vr) => ({
            id: vr.id,
            itemTitle: vr.itemTitle,
            completedAt: vr.completedAt}));
        }
      }});
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
            status: this.mapVoucherStatus(vr.status, vr.deniedAt, vr.expiresAt, vr.redeemedAt),
            requestedAt: vr.createdAt,
            approvedAt: vr.approvedAt ?? undefined,
            validUntil: vr.expiresAt ?? vr.createdAt,
            expiresAt: vr.expiresAt ?? undefined,
            redeemedAt: vr.redeemedAt ?? undefined,
            shortDescription: vr.shortDescription ?? undefined,
            photoUrl: vr.photoUrl ? this.platformApi.resolveUploadUrl(vr.photoUrl) : undefined,
            providerOffering: vr.providerOffering ?? undefined,
            location: vr.location ?? undefined}));
          this.profileVolunteerRequests = (res.profile.volunteerRequests ?? []).map((vr) => ({
            id: vr.id,
            itemTitle: vr.itemTitle,
            completedAt: vr.completedAt}));
        }
      } catch {
        // Ignore
      }
    }
    refresher?.complete?.();
  }

  private mapVoucherStatus(
    status: string,
    deniedAt: string | null,
    expiresAt: string | null,
    redeemedAt?: string | null
  ): 'pending' | 'approved' | 'expired' | 'redeemed' {
    if (status === 'redeemed' || redeemedAt) return 'redeemed';
    if (deniedAt) return 'expired';
    if (status === 'approved') return 'approved';
    if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
    return 'pending';
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
    this.dismissedSub?.unsubscribe();
    this.unlockSub?.unsubscribe();
  }

  private updateDisplayProfile(): void {
    const p = this.profileInfo;
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || '';
    this.userProfile = {
      ...this.userProfile,
      name,
      email: p.email};
  }

  get displayName(): string {
    return [this.profileInfo.firstName, this.profileInfo.lastName].filter(Boolean).join(' ') || '';
  }

  get displayVouchers(): Voucher[] | null {
    if (!this.profileVouchers) return null;
    return this.profileVouchers.filter((v) => !this.dismissedIds.has(v.id));
  }

  onVoucherRemove(v: Voucher): void {
    this.dismissedVouchers.dismiss(v.id);
  }

  private getProfileParams(): { deviceId?: string; email?: string } {
    const deviceId = this.deviceId.getDeviceId();
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    return { deviceId: deviceId || undefined, email: email || undefined };
  }

  async onVolunteerMarkComplete(vr: { id: string; itemTitle: string | null; completedAt: string | null }): Promise<void> {
    if (this.volunteerActionLoading || vr.completedAt) return;
    const params = this.getProfileParams();
    if (!params.deviceId && !params.email) return;
    this.volunteerActionLoading = vr.id;
    try {
      const res = await this.platformApi.markVolunteerRequestComplete(vr.id, params);
      if (res.ok) {
        this.loadProfile();
      }
    } catch {
      // Error logged by API
    } finally {
      this.volunteerActionLoading = null;
    }
  }

  async onVolunteerDelete(vr: { id: string; itemTitle: string | null; completedAt: string | null }): Promise<void> {
    const params = this.getProfileParams();
    if (!params.deviceId && !params.email) return;
    this.volunteerActionLoading = vr.id;
    try {
      const res = await this.platformApi.deleteVolunteerRequest(vr.id, params);
      if (res.ok) {
        this.loadProfile();
      }
    } catch {
      // Error logged by API
    } finally {
      this.volunteerActionLoading = null;
    }
  }

  get apiIntakeCompleted(): boolean {
    return this.profileIntakeCompleted || this.appUserData.hasIntakeCompleted() || this.localIntakeUnlocked;
  }

  /** Prompt volunteers in My Service to scan QR for provider contact info. */
  get showVolunteerProviderAccessPrompt(): boolean {
    return this.intakeRequired && !this.apiIntakeCompleted;
  }

  async editProfile(): Promise<void> {
    const modal = await this.modalController.create({
      component: UserProfileFormModalComponent,
      componentProps: {
        headerTitle: 'Your information',
        message: 'Email is required for intake validation.',
        firstName: this.profileInfo.firstName,
        lastName: this.profileInfo.lastName,
        email: this.profileInfo.email}});
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.userProfileService.setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email});
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
        newsletterOptIn: wantsNewsletter});
      this.platformApi
        .getAppUser({
          deviceId: this.deviceId.getDeviceId(),
          email: email.trim() || undefined})
        .subscribe({
          next: (res) => {
            if (res?.user) {
              this.appUserData.setData(res.user);
            }
          }});
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
        email: this.profileInfo.email}});
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.userProfileService.setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email});
      await this.saveProfileToApi(data.firstName ?? '', data.lastName ?? '', data.email ?? '');
      this.router.navigate(['/tabs/service-unlock/scan']);
    }
  };

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
        deviceId: this.deviceId.getDeviceId()});
      if (res.sent) {
        const alert = await this.alertController.create({
          header: 'Check your email',
          message: 'We sent a verification link to ' + email + '. Click the link to verify your email.',
          buttons: ['OK']});
        await alert.present();
      } else {
        const alert = await this.alertController.create({
          header: 'Could not send email',
          message: res.error ?? 'Please try again later.',
          buttons: ['OK']});
        await alert.present();
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Please check your connection and try again.';
      const alert = await this.alertController.create({
        header: 'Could not send email',
        message: msg,
        buttons: ['OK']});
      await alert.present();
    } finally {
      this.verifyingEmail = false;
    }
  }

  async openVoucherModal(voucher: Voucher): Promise<void> {
    this.voucherModalService.setVoucher(voucher);
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    const modal = await this.modalController.create({
      component: VoucherDetailModalComponent,
      componentProps: {
        voucher,
        deviceId: this.deviceId.getDeviceId(),
        email: email || undefined},
      cssClass: 'voucher-detail-modal-sheet',
      presentingElement: await this.modalController.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
      breakpoints: [0, 1],
      initialBreakpoint: 1});
    await modal.present();
    modal.onDidDismiss().then((result) => {
      this.voucherModalService.clear();
      if (result.data?.redeemed) {
        this.loadProfile();
      }
    });
  }
}
