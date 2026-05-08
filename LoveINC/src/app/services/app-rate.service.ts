import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { InAppReview } from '@capacitor-community/in-app-review';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppRateService {
  /**
   * System rating UI (iOS SKStoreReviewController, Play In-App Review).
   * Apple/Google may skip showing the dialog (quotas, environment, etc.).
   */
  async requestNativeReview(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }
    await InAppReview.requestReview();
  }

  /** Opens the public store listing in the browser / store app. */
  async openStoreListing(): Promise<void> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      return;
    }
    let url: string | undefined;
    if (platform === 'ios') {
      url = environment.iosAppStoreListingUrl?.trim();
      if (!url) {
        console.warn(
          'AppRateService: Set environment.iosAppStoreListingUrl to open the App Store.'
        );
        return;
      }
    } else if (platform === 'android') {
      url = environment.androidPlayStoreListingUrl?.trim();
    }
    if (url) {
      await AppLauncher.openUrl({ url });
    }
  }
}
