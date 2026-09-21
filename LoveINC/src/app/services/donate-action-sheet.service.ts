import { Injectable } from '@angular/core';
import { ActionSheetController, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AppLauncher } from '@capacitor/app-launcher';
import { DONATE_ACTION_SHEET_CLASS } from '../shared/action-sheet-classes';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';
import { OrganizationContextService } from './organization-context.service';

@Injectable({
  providedIn: 'root'
})
export class DonateActionSheetService {
  constructor(
    private actionSheetController: ActionSheetController,
    private router: Router,
    private navController: NavController,
    private organizationContext: OrganizationContextService,
  ) {}

  async openDonateActionSheet(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: `Donate to ${this.organizationContext.publicName}`,
      buttons: [
        {
          text: 'Make a secure online donation.',
          icon: 'card-outline',
          handler: () => {
            void this.handleOnlineDonation();
          }
        },
        {
          text: 'Goods, clothing, household items.',
          icon: 'shirt-outline',
          handler: () => {
            this.handleGoodsDonation();
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
    const url = this.organizationContext.donateUrl;
    try {
      await AppLauncher.openUrl({ url });
    } catch (err) {
      console.error('DonateActionSheetService.handleOnlineDonation', err);
      window.open(url, '_blank');
    }
  }
}
