import { Component, EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonFab, 
  IonFabButton,
  ActionSheetController,
  AlertController
} from '@ionic/angular/standalone';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonFab, 
    IonFabButton
  ],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private router: Router,
    private donateActionSheetService: DonateActionSheetService
  ) {}

  async openServicesMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Services at Love INC Newberg',
      cssClass: 'services-action-sheet',
      buttons: [
        {
          text: 'Connection Center',
          icon: 'people-circle-outline',
          handler: () => {
            this.showServiceDetail('Connection Center');
          }
        },
        {
          text: 'Gap Services',
          icon: 'construct-outline',
          handler: () => {
            this.router.navigate(['/tabs/gap-ministries']);
          }
        },
        {
          text: 'Transformational Classes',
          icon: 'school-outline',
          handler: () => {
            this.router.navigate(['/tabs/transformation-classes']);
          }
        },
        {
          text: 'J.O.B.S.',
          icon: 'briefcase-outline',
          handler: () => {
            this.showServiceDetail('J.O.B.S.');
          }
        },
        {
          text: 'Hesed House',
          icon: 'house-outline',
          handler: () => {
            this.showServiceDetail('Hesed House');
          }
        },
        {
          text: 'Prayer',
          icon: 'heart-outline',
          handler: () => {
            this.showServiceDetail('Prayer');
          }
        },
        {
          text: 'Donate',
          icon: 'gift-outline',
          handler: () => {
            this.donateActionSheetService.openDonateActionSheet();
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async showServiceDetail(service: string) {
    // TODO: Navigate to service detail page with service parameter
    const alert = await this.alertController.create({
      header: service,
      message: `You selected: ${service}\n\nService detail page will be implemented soon.`,
      buttons: ['OK']
    });

    await alert.present();
  }
}
