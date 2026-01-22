import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

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
          text: 'Goods like clothing, furniture, household items.',
          icon: 'shirt-outline',
          handler: () => {
            this.handleGoodsDonation();
          }
        },
        {
          text: 'Make a secure online donation.',
          icon: 'card-outline',
          handler: () => {
            this.handleOnlineDonation();
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ],
      cssClass: 'donate-action-sheet'
    });

    await actionSheet.present();
  }

  private handleGoodsDonation(): void {
    this.router.navigate(['/tabs/donate-goods']);
  }

  private handleOnlineDonation(): void {
    // TODO: Navigate to online donation page or form
    console.log('Navigate to Online Donation');
  }
}