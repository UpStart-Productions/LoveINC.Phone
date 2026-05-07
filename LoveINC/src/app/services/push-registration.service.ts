import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { PlatformApiService } from './platform/platform-api.service';
import { environment } from '../../environments/environment';

/**
 * Registers the device for push notifications with the backend.
 * Triggered from AppComponent: deferred after cold start if onboarding was already done,
 * or shortly after onboarding completion / skip (see onboardingJustCompleted$).
 */
@Injectable({ providedIn: 'root' })
export class PushRegistrationService {
  constructor(private readonly platformApi: PlatformApiService) {}

  async register(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const platform = Capacitor.getPlatform() as 'ios' | 'android';
    if (platform !== 'ios' && platform !== 'android') return;
    if (!environment.apiKey?.trim()) return;

    try {
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

      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== 'granted') return;

      await PushNotifications.register();
      const token = await regPromise;
      if (!token?.trim()) return;

      await this.platformApi.registerPushDevice({
        platform,
        token,
        tenantSlug: environment.tenantSlug,
      });
    } catch {
      // Silently ignore - user may have denied or registration may fail
    }
  }
}
