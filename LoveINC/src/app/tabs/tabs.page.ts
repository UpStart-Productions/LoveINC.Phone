import { Component, EnvironmentInjector, inject } from '@angular/core';
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
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  home, 
  informationCircleOutline, 
  informationCircle,
  newspaperOutline,
  newspaper,
  mailOutline,
  mail,
  heartOutline,
  handRightOutline,
  peopleOutline,
  giftOutline,
  closeOutline
} from 'ionicons/icons';

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
    private alertController: AlertController
  ) {
    addIcons({ 
      homeOutline, 
      home, 
      informationCircleOutline, 
      informationCircle,
      newspaperOutline,
      newspaper,
      mailOutline,
      mail,
      heartOutline,
      handRightOutline,
      peopleOutline,
      giftOutline,
      closeOutline
    });
  }

  async openServicesMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Love INC Services',
      buttons: [
        {
          text: 'Get Help',
          icon: 'hand-right-outline',
          handler: () => {
            this.showServiceMessage('Get Help');
          }
        },
        {
          text: 'Volunteer',
          icon: 'people-outline',
          handler: () => {
            this.showServiceMessage('Volunteer');
          }
        },
        {
          text: 'Give',
          icon: 'gift-outline',
          handler: () => {
            this.showServiceMessage('Give');
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

  async showServiceMessage(service: string) {
    const alert = await this.alertController.create({
      header: service,
      message: `You selected: ${service}\n\nThis feature will be implemented soon.`,
      buttons: ['OK']
    });

    await alert.present();
  }
}
