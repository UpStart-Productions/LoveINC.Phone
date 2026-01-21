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
  peopleCircleOutline,
  constructOutline,
  schoolOutline,
  briefcaseOutline,
  homeOutline as houseOutline,
  handRightOutline,
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
      peopleCircleOutline,
      constructOutline,
      schoolOutline,
      briefcaseOutline,
      houseOutline,
      handRightOutline,
      closeOutline
    });
  }

  async openServicesMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Services',
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
          text: 'Gap Ministries',
          icon: 'construct-outline',
          handler: () => {
            this.showServiceDetail('Gap Ministries');
          }
        },
        {
          text: 'Transformational Classes',
          icon: 'school-outline',
          handler: () => {
            this.showServiceDetail('Transformational Classes');
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
