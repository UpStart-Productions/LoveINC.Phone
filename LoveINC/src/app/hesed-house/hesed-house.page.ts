import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

/** Hesed House / Love INC Newberg line (same as FAQ / Connection Center). */
const HESED_HOUSE_PHONE_TEL = '5035373999';

@Component({
  selector: 'app-hesed-house',
  templateUrl: './hesed-house.page.html',
  styleUrls: ['./hesed-house.page.scss'],
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
export class HesedHousePage implements OnInit {
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

  callHesedHouse() {
    window.open(`tel:${HESED_HOUSE_PHONE_TEL}`, '_system');
  }
}
