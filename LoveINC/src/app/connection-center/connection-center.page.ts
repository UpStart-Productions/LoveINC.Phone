import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  NavController,
} from '@ionic/angular/standalone';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';

@Component({
  selector: 'app-connection-center',
  templateUrl: './connection-center.page.html',
  styleUrls: ['./connection-center.page.scss'],
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
    AppBackButtonComponent,
  ],
})
export class ConnectionCenterPage implements OnInit {
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly donateButtonService = inject(DonateButtonService);
  private readonly donateActionSheetService = inject(DonateActionSheetService);

  showDonateButton = false;

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    void this.donateActionSheetService.openDonateActionSheet();
  }

  goToGetAssistance() {
    void navigateAppForward(this.navController, this.router, ['/tabs/assistance/intro'], {
      queryParams: { from: 'connection-center' },
    });
  }
}
