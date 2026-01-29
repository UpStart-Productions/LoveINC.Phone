import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { AlertsModalService } from '../services/alerts-modal.service';
import { OnboardingService } from '../services/onboarding.service';
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

interface MoreItem {
  name: string;
  icon: string;
  lucideIcon?: string;
  route?: string;
  handler?: () => void;
}

@Component({
  selector: 'app-more',
  templateUrl: './more.page.html',
  styleUrls: ['./more.page.scss'],
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
  ],
})
export class MorePage implements OnInit {
  moreItems: MoreItem[] = [
    {
      name: 'Profile',
      icon: 'person-circle-outline',
      route: '/tabs/profile',
    },
    {
      name: 'FAQ',
      icon: 'help-circle-outline',
      route: '/tabs/faq',
    },
    {
      name: 'Impact Stories',
      icon: 'heart-outline',
      route: '/tabs/impact-stories',
    },
    {
      name: 'Verse of the Day',
      icon: 'book-outline',
      route: '/tabs/verse-of-the-day',
    },
    {
      name: 'Videos',
      icon: 'play-circle-outline',
      route: '/tabs/videos',
    },
    {
      name: 'Tools',
      icon: 'construct-outline',
      route: '/tabs/tools',
    },
    {
      name: 'Saved Items',
      icon: 'bookmark-outline',
      route: '/tabs/saved-items',
    },
    {
      name: 'Church Partnerships',
      icon: 'people-circle-outline',
      lucideIcon: 'church',
      route: '/tabs/church-partnerships',
    },
    {
      name: 'Settings',
      icon: 'settings-outline',
      route: '/tabs/settings',
    },
    {
      name: 'Developer Options',
      icon: 'code-outline',
      route: '/tabs/developer-options',
    },
  ];

  showDonateButton: boolean = false;
  userFirstInitial: string | null = null;

  constructor(
    private router: Router,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private alertsModalService: AlertsModalService,
    private onboardingService: OnboardingService
  ) {}

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
    const firstName = this.onboardingService.getUserFirstName();
    if (firstName && firstName.trim().length > 0) {
      this.userFirstInitial = firstName.trim().charAt(0).toUpperCase();
    }
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  handleItemClick(item: MoreItem) {
    if (item.route) {
      this.router.navigateByUrl(item.route);
    } else if (item.handler) {
      item.handler();
    }
  }
}
