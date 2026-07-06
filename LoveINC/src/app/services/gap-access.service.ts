import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { PlatformApiService } from './platform/platform-api.service';
import { AppUserDataService } from './app-user-data.service';
import { UserProfileService } from './user-profile.service';
import { DeviceIdService } from './device-id.service';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';

/**
 * Provider contact access (QR / intake unlock) for all users — no onboarding role checks.
 * Drives class registration intake gate and provider phone/email visibility.
 */
@Injectable({ providedIn: 'root' })
export class GapAccessService {
  private intakeRequired = true;
  private providerContactAccessGranted = false;
  private stateLoaded = false;

  get orgIntakeRequired(): boolean {
    return this.intakeRequired;
  }

  /** True after QR scan or API intake completion. */
  get hasProviderContactAccess(): boolean {
    return this.providerContactAccessGranted;
  }

  /**
   * @deprecated Always false — Gap list uses full cards; contact fields hidden until unlock.
   */
  get isRestrictedListActive(): boolean {
    return false;
  }

  /** Intake required by org and user has not unlocked provider contact yet. */
  get isIntakeGateActive(): boolean {
    if (!this.stateLoaded) {
      return false;
    }
    if (!this.intakeRequired) {
      return false;
    }
    return !this.providerContactAccessGranted;
  }

  get hasStateLoaded(): boolean {
    return this.stateLoaded;
  }

  constructor(
    private platformApi: PlatformApiService,
    private appUserData: AppUserDataService,
    private userProfile: UserProfileService,
    private deviceId: DeviceIdService,
    private serviceUnlock: ServiceUnlockService
  ) {}

  async refreshState(): Promise<void> {
    this.stateLoaded = false;
    await this.serviceUnlock.ensureInitialized();

    const localUnlocked = this.serviceUnlock.isUnlocked || this.appUserData.hasIntakeCompleted();
    const deviceId = this.deviceId.getDeviceId() || undefined;
    const email = (this.userProfile.getProfile().email || '').trim() || undefined;

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
      this.providerContactAccessGranted = localUnlocked || profileIntake;
    } catch {
      this.intakeRequired = false;
      this.providerContactAccessGranted = localUnlocked;
    } finally {
      this.stateLoaded = true;
    }
  }
}
