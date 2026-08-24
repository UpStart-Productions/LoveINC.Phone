import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';
import { SHARE_APP_BLURB, SHARE_APP_SHEET_TITLE } from '../shared/love-inc-contact.constants';
import { SharingService } from './sharing/sharing.service';

@Injectable({ providedIn: 'root' })
export class ShareAppService {
  private readonly sharingService = inject(SharingService);

  async shareApp(): Promise<void> {
    const platform = Capacitor.getPlatform();
    let storeUrl: string | undefined;
    if (platform === 'ios') {
      storeUrl = environment.iosAppStoreListingUrl?.trim() || undefined;
    } else if (platform === 'android') {
      storeUrl = environment.androidPlayStoreListingUrl?.trim() || undefined;
    }

    await this.sharingService.shareContent({
      title: SHARE_APP_SHEET_TITLE,
      subject: SHARE_APP_SHEET_TITLE,
      actionSheetHeader: SHARE_APP_SHEET_TITLE,
      htmlContent: `<p>${SHARE_APP_BLURB}</p>`,
      url: storeUrl,
    });
  }
}
