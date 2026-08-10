import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppLauncher } from '@capacitor/app-launcher';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';

const JOBS_APPLICATION_URL = 'https://loveincnewberg.org/jobs-application-form/';

@Component({
  selector: 'app-jobs-program',
  templateUrl: './jobs-program.page.html',
  styleUrls: ['./jobs-program.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    NotificationsButtonComponent,
  ],
})
export class JobsProgramPage implements OnInit {
  showDonateButton = false;

  constructor(
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService
  ) {}

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  async openApplicationForm() {
    try {
      await AppLauncher.openUrl({ url: JOBS_APPLICATION_URL });
    } catch (err) {
      console.error('JobsProgramPage.openApplicationForm', err);
      window.open(JOBS_APPLICATION_URL, '_blank');
    }
  }
}
