import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AppLauncher } from '@capacitor/app-launcher';
import { DONATE_ACTION_SHEET_CLASS } from '../shared/action-sheet-classes';

/** External donation page (Givebutter-powered flow still lives at /tabs/donate-money when re-enabled). */
const LOVE_INC_ONLINE_DONATE_URL = 'https://loveincnewberg.org/donate/';

@Injectable({
  providedIn: 'root'
})
export class DonateActionSheetService {
  constructor(
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  async openDonateActionSheet(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Donate to Love INC Newberg',
      buttons: [
        {
          text: 'Goods, clothing, household items.',
          icon: 'shirt-outline',
          handler: () => {
            this.handleGoodsDonation();
          }
        },
        {
          text: 'Make a secure online donation.',
          icon: 'card-outline',
          handler: () => {
            void this.handleOnlineDonation();
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      cssClass: DONATE_ACTION_SHEET_CLASS
    });

    await actionSheet.present();
  }

  private handleGoodsDonation(): void {
    this.router.navigate(['/tabs/donate-goods']);
  }

  private async handleOnlineDonation(): Promise<void> {
    try {
      await AppLauncher.openUrl({ url: LOVE_INC_ONLINE_DONATE_URL });
    } catch (err) {
      console.error('DonateActionSheetService.handleOnlineDonation', err);
      window.open(LOVE_INC_ONLINE_DONATE_URL, '_blank');
    }
    // In-app Givebutter (Powered By) page — keep route; re-enable when needed:
    // this.router.navigate(['/tabs/donate-money']);
  }
}