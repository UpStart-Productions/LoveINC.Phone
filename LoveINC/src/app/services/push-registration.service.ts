import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { PlatformApiService } from './platform/platform-api.service';
import { environment } from '../../environments/environment';

/**
 * Registers the device for push notifications with the backend.
 * Runs only on native platforms (iOS/Android). Calls the platform API
 * to register the FCM/APNs token with the Nonprofit Mobile Platform.
 */
@Injectable({ providedIn: 'root' })
export class PushRegistrationService {
  constructor(private readonly platformApi: PlatformApiService) {}

  /**
   * Request permission, get the device token, and register with the backend.
   * Call this after platform.ready() when running on a native device.
   */
  async register(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const platform = Capacitor.getPlatform() as 'ios' | 'android';
    if (platform !== 'ios' && platform !== 'android') {
      return;
    }
    if (!environment.apiKey?.trim()) {
      console.warn('PushRegistrationService: apiKey not configured, skipping');
      return;
    }

    try {
      // Add listeners before register() so we capture the token when it arrives
      let resolveToken!: (value: string) => void;
      let rejectToken!: (reason: Error) => void;
      const regPromise = new Promise<string>((resolve, reject) => {
        resolveToken = resolve;
        rejectToken = reject;
      });
      await PushNotifications.addListener('registration', (token) =>
        resolveToken(token.value)
      );
      await PushNotifications.addListener('registrationError', (err) =>
        rejectToken(new Error(err.error ?? 'Registration failed'))
      );

      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') {
        console.log('PushRegistrationService: permission denied');
        return;
      }

      await PushNotifications.register();
      const token = await regPromise;

      if (!token?.trim()) {
        console.warn('PushRegistrationService: empty token received');
        return;
      }

      await this.platformApi.registerPushDevice({
        platform,
        token,
        tenantSlug: environment.tenantSlug,
      });
      console.log('PushRegistrationService: registered successfully');
    } catch (err) {
      console.error('PushRegistrationService: registration failed', err);
    }
  }
}
