import { Component, OnInit, inject } from '@angular/core';
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

import { OrganizationContextService } from '../services/organization-context.service';

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
  private readonly organizationContext = inject(OrganizationContextService);

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
    window.open(`tel:${this.organizationContext.officeTel}`, '_system');
  }
}
