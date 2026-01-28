import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationExtras } from '@angular/router';
import { DonateButtonService } from './donate-button.service';
import { DonateActionSheetService } from './donate-action-sheet.service';
import { AlertsModalService } from '../services/alerts-modal.service';
import { LucideAngularModule } from 'lucide-angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';

interface Service {
  name: string;
  icon: string;
  lucideIcon?: string;
  route?: string;
  handler?: () => void;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.page.html',
  styleUrls: ['./services.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
  ],
})
export class ServicesPage implements OnInit {
  services: Service[] = [
    {
      name: 'Connection Center',
      icon: 'people-circle-outline',
      handler: () => {
        // TODO: Navigate to Connection Center detail page
        console.log('Connection Center selected');
      },
    },
    {
      name: 'Gap Ministries',
      icon: 'hand-right-outline',
      lucideIcon: 'hand-helping',
      route: '/tabs/gap-ministries',
    },
    {
      name: 'Transformational Classes',
      icon: 'school-outline',
      route: '/tabs/transformation-classes',
    },
    {
      name: 'J.O.B.S.',
      icon: 'briefcase-outline',
      handler: () => {
        // TODO: Navigate to J.O.B.S. detail page
        console.log('J.O.B.S. selected');
      },
    },
    {
      name: 'Hesed House',
      icon: 'house-outline',
      handler: () => {
        // TODO: Navigate to Hesed House detail page
        console.log('Hesed House selected');
      },
    },
    {
      name: 'Prayer',
      icon: 'heart-outline',
      handler: () => {
        // TODO: Navigate to Prayer detail page
        console.log('Prayer selected');
      },
    },
  ];

  showDonateButton: boolean = false;

  constructor(
    private router: Router,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  handleServiceClick(service: Service) {
    if (service.route) {
      // Use navigateByUrl to ensure query params are properly included
      const url = `${service.route}?from=services`;
      console.log('Navigating to:', url);
      this.router.navigateByUrl(url);
    } else if (service.handler) {
      service.handler();
    }
  }
}
