import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

import { LOVE_INC_OFFICE_TEL } from '../shared/love-inc-contact.constants';

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
    IonBackButton,
    IonIcon,
    NotificationsButtonComponent,
  ],
})
export class ConnectionCenterPage implements OnInit {
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

  callLoveInc() {
    window.open(`tel:${LOVE_INC_OFFICE_TEL}`, '_self');
  }
}
