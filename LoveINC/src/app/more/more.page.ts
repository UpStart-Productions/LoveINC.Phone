import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { OnboardingService } from '../services/onboarding.service';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonCard,
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
    IonCard,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    NotificationsButtonComponent,
  ],
})
export class MorePage implements OnInit {
  moreItems: MoreItem[] = [
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
      name: 'Learning Tools',
      icon: 'construct-outline',
      route: '/tabs/tools',
    },
    {
      name: 'FAQ',
      icon: 'help-circle-outline',
      route: '/tabs/faq',
    },
    {
      name: 'Church Partnerships',
      icon: 'people-circle-outline',
      lucideIcon: 'church',
      route: '/tabs/church-partnerships',
    },
    {
      name: 'My Profile',
      icon: 'person-circle-outline',
      route: '/tabs/profile',
    },
    // {
    //   name: 'Developer Options',
    //   icon: 'code-outline',
    //   route: '/tabs/developer-options',
    // },
    // {
    //   name: 'Saved Items',
    //   icon: 'bookmark-outline',
    //   route: '/tabs/saved-items',
    // },
    // {
    //   name: 'Settings',
    //   icon: 'settings-outline',
    //   route: '/tabs/settings',
    // },
  ];

  showDonateButton: boolean = false;
  userFirstInitial: string | null = null;

  constructor(
    private router: Router,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
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

  handleItemClick(item: MoreItem) {
    if (item.route) {
      this.router.navigateByUrl(item.route);
    } else if (item.handler) {
      item.handler();
    }
  }
}
