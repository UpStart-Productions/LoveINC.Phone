import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { OnboardingService } from './onboarding.service';
import { PlatformApiService } from './platform/platform-api.service';
import { AppUserDataService } from './app-user-data.service';
import { UserProfileService } from './user-profile.service';
import { DeviceIdService } from './device-id.service';

/**
 * Drives the reduced Gap list (photo + title only) and **class** detail primary CTA
 * (Register vs "Complete Intake to Register") for client/exploring users who have not completed intake.
 * Volunteer- or give-only users (not also Get Help or exploring) get the full experience — 1a.
 * Client + donor still uses intake gating. API errors default to not restricting (2b).
 */
@Injectable({ providedIn: 'root' })
export class GapAccessService {
  private intakeRequired = true;
  private intakeComplete = true;
  private stateLoaded = false;

  /** Org rule (after refreshState) — for voucher / card gating on Gap page. */
  get orgIntakeRequired(): boolean {
    return this.intakeRequired;
  }

  constructor(
    private onboarding: OnboardingService,
    private platformApi: PlatformApiService,
    private appUserData: AppUserDataService,
    private userProfile: UserProfileService,
    private deviceId: DeviceIdService
  ) {}

  /**
   * After refreshState(), true when client/exploring intake is required and not complete
   * (reduced Gap list, or class "Complete Intake to Register" on content-detail).
   */
  get isRestrictedListActive(): boolean {
    return this.computeRestricted();
  }

  get hasStateLoaded(): boolean {
    return this.stateLoaded;
  }

  /** Get Help or exploring — intake and Gap list gating can apply. */
  private isClientOrExploringPath(): boolean {
    return this.onboarding.isExploring() || this.onboarding.hasSelectedOption('get-help');
  }

  /** Full Gap (not reduced list) for donate/volunteer-only users, not for client + donor. */
  private isVolunteerOrGiveOnlyPath(): boolean {
    if (this.isClientOrExploringPath()) {
      return false;
    }
    return (
      this.onboarding.hasSelectedOption('volunteer') || this.onboarding.hasSelectedOption('give')
    );
  }

  private computeRestricted(): boolean {
    if (!this.stateLoaded) {
      return false;
    }
    if (this.isVolunteerOrGiveOnlyPath()) {
      return false;
    }
    const clientOrExploring = this.isClientOrExploringPath();
    if (!clientOrExploring) {
      return false;
    }
    if (!this.intakeRequired) {
      return false;
    }
    if (this.intakeComplete) {
      return false;
    }
    return true;
  }

  /**
   * Loads client-access + app user profile. On failure, does not restrict (2b):
   * intake not required, intake considered complete.
   */
  async refreshState(): Promise<void> {
    this.stateLoaded = false;
    if (this.isVolunteerOrGiveOnlyPath()) {
      this.stateLoaded = true;
      this.intakeRequired = true;
      this.intakeComplete = true;
      return;
    }
    const clientOrExploring = this.isClientOrExploringPath();
    if (!clientOrExploring) {
      this.stateLoaded = true;
      this.intakeRequired = false;
      this.intakeComplete = true;
      return;
    }

    const deviceId = this.deviceId.getDeviceId() || undefined;
    const email =
      (this.userProfile.getProfile().email || this.onboarding.getOnboardingData()?.email || '').trim() ||
      undefined;
    try {
      const [clientRes, profRes] = await Promise.all([
        firstValueFrom(this.platformApi.getClientAccess().pipe(take(1))),
        deviceId || email
          ? firstValueFrom(
              this.platformApi.getAppUserProfile({ deviceId, email: email || undefined }).pipe(take(1))
            )
          : Promise.resolve(null),
      ]);
      this.intakeRequired = clientRes?.intakeRequired ?? true;
      const profileIntake = profRes?.profile?.intakeCompleted ?? false;
      this.intakeComplete = profileIntake || this.appUserData.hasIntakeCompleted();
    } catch {
      this.intakeRequired = false;
      this.intakeComplete = true;
    } finally {
      this.stateLoaded = true;
    }
  }
}
