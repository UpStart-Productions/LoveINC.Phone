import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AppLauncher } from '@capacitor/app-launcher';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
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
    IonBackButton,
    IonIcon,
    NotificationsButtonComponent,
  ],
})
export class JobsProgramPage implements OnInit {
  fromServices = false;
  showDonateButton = false;

  constructor(
    private route: ActivatedRoute,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService
  ) {}

  ngOnInit() {
    const fromParam = this.route.snapshot.queryParamMap.get('from');
    this.fromServices = fromParam === 'services';
    this.route.queryParamMap.subscribe((params) => {
      this.fromServices = params.get('from') === 'services';
    });
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  get backDefaultHref(): string {
    return this.fromServices ? '/tabs/services' : '/tabs/home';
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
