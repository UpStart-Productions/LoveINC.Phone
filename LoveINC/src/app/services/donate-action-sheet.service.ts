import { Injectable } from '@angular/core';
import { ActionSheetController, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { DONATE_ACTION_SHEET_CLASS } from '../shared/action-sheet-classes';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';

/** TEMP marketing dummy — restore AppLauncher + https://loveincnewberg.org/donate/ when reverting. */

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
            void actionSheet.onDidDismiss().then(() => {
              this.handleOnlineDonation();
            });
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

  private handleOnlineDonation(): void {
    void navigateAppForward(this.navController, this.router, ['/tabs/donate-money']);
  }
}
