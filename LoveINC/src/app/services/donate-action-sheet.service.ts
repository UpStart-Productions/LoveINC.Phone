import { Injectable } from '@angular/core';
import { ActionSheetController, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AppLauncher } from '@capacitor/app-launcher';
import { DONATE_ACTION_SHEET_CLASS } from '../shared/action-sheet-classes';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';

/** External donation page (Givebutter-powered flow still lives at /tabs/donate-money when re-enabled). */
const LOVE_INC_ONLINE_DONATE_URL = 'https://loveincnewberg.org/donate/';

@Injectable({
  providedIn: 'root'
})
export class DonateActionSheetService {
  constructor(
    private actionSheetController: ActionSheetController,
    private router: Router,
    private navController: NavController
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
    void navigateAppForward(this.navController, this.router, ['/tabs/donate-goods']);
  }

  private async handleOnlineDonation(): Promise<void> {
    try {
      await AppLauncher.openUrl({ url: LOVE_INC_ONLINE_DONATE_URL });
    } catch (err) {
      console.error('DonateActionSheetService.handleOnlineDonation', err);
      window.open(LOVE_INC_ONLINE_DONATE_URL, '_blank');
    }
    // In-app Givebutter (Powered By) page — keep route; re-enable when needed:
    // navigateAppForward(this.navController, this.router, ['/tabs/donate-money']);
  }
}
