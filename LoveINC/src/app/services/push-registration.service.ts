import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { PlatformApiService } from './platform/platform-api.service';
import { GrovLinkDatabaseService } from './grovlink-database.service';
import { environment } from '../../environments/environment';

export const PUSH_NOTIFICATIONS_PREF_KEY = 'push_notifications_enabled';

/**
 * Registers the device for push notifications with the backend.
 * Triggered from AppComponent when the user preference is enabled.
 */
@Injectable({ providedIn: 'root' })
export class PushRegistrationService {
  constructor(
    private readonly platformApi: PlatformApiService,
    private readonly grovLinkDb: GrovLinkDatabaseService
  ) {}

  /** User preference in SQLite. Defaults to true when unset. */
  async isUserOptIn(): Promise<boolean> {
    try {
      const value = await this.grovLinkDb.getAppPreference(PUSH_NOTIFICATIONS_PREF_KEY);
      if (value === null) return true;
      return value === 'true';
    } catch {
      return true;
    }
  }

  async setUserOptIn(enabled: boolean): Promise<void> {
    await this.grovLinkDb.setAppPreference(
      PUSH_NOTIFICATIONS_PREF_KEY,
      enabled ? 'true' : 'false'
    );
  }

  async isOsPermissionGranted(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'granted';
    } catch {
      return false;
    }
  }

  async isOsPermissionDenied(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'denied';
    } catch {
      return false;
    }
  }

  /** Registers only when the user has not opted out. */
  async registerIfEnabled(): Promise<void> {
    if (!(await this.isUserOptIn())) return;
    await this.register();
  }

  async register(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    const platform = Capacitor.getPlatform() as 'ios' | 'android';
    if (platform !== 'ios' && platform !== 'android') return false;
    if (!environment.apiKey?.trim()) return false;

    try {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== 'granted') return false;

      const token = await this.obtainRegistrationToken();
      if (!token?.trim()) return false;

      await this.platformApi.registerPushDevice({
        platform,
        token,
        tenantSlug: environment.tenantSlug,
      });
      return true;
    } catch {
      return false;
    }
  }

  async disablePush(): Promise<void> {
    await this.setUserOptIn(false);
    if (!Capacitor.isNativePlatform()) return;
    try {
      await PushNotifications.unregister();
    } catch {
      // Ignore unregister failures
    }
  }

  async enablePush(): Promise<{ ok: boolean; osDenied: boolean }> {
    await this.setUserOptIn(true);
    if (!Capacitor.isNativePlatform()) {
      return { ok: false, osDenied: false };
    }

    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'denied') {
      return { ok: false, osDenied: true };
    }

    const ok = await this.register();
    if (!ok) {
      const denied = await this.isOsPermissionDenied();
      return { ok: false, osDenied: denied };
    }
    return { ok: true, osDenied: false };
  }

  private async obtainRegistrationToken(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const regListener = await PushNotifications.addListener('registration', (token) => {
        void regListener.remove();
        resolve(token.value);
      });
      const errListener = await PushNotifications.addListener('registrationError', (err) => {
        void errListener.remove();
        reject(new Error(err.error ?? 'Registration failed'));
      });

      try {
        await PushNotifications.register();
      } catch (err) {
        void regListener.remove();
        void errListener.remove();
        reject(err);
      }
    });
  }
}
