import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationExtras } from '@angular/router';
import { DonateButtonService } from './donate-button.service';
import { DonateActionSheetService } from './donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { LucideAngularModule } from 'lucide-angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';

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
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    NotificationsButtonComponent,
    AppBackButtonComponent]})
export class ServicesPage implements OnInit {
  services: Service[] = [
    {
      name: 'Connection Center',
      icon: 'people-circle-outline',
      route: '/tabs/connection-center'},
    {
      name: 'Gap Ministries',
      icon: 'hand-right-outline',
      lucideIcon: 'hand-helping',
      route: '/tabs/gap-ministries'},
    {
      name: 'Transformational Classes',
      icon: 'school-outline',
      route: '/tabs/transformation-classes'},
    {
      name: 'J.O.B.S.',
      icon: 'briefcase-outline',
      route: '/tabs/jobs-program'},
    {
      name: 'Hesed House',
      icon: 'house-outline',
      route: '/tabs/hesed-house'},
    {
      name: 'Prayer Request',
      icon: 'heart-outline',
      route: '/tabs/prayer-request'}];

  showDonateButton: boolean = false;

  constructor(
    private router: Router,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService
  ) {}

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
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
