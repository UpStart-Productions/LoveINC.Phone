import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { LucideAngularModule } from 'lucide-angular';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { OnboardingService } from '../services/onboarding.service';
import { SharingService } from '../services/sharing/sharing.service';
import { environment } from '../../environments/environment';
import {
  LOVE_INC_PRIVACY_POLICY_URL,
  LOVE_INC_TERMS_OF_USE_URL,
  LOVE_INC_PUBLIC_NAME,
} from '../shared/love-inc-contact.constants';
import { AppVersionService } from '../services/app-version.service';
import { AppRateService } from '../services/app-rate.service';
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
  /** Opens in system browser (e.g. legal pages). */
  externalUrl?: string;
  handler?: () => void | Promise<void>;
}

interface MoreSection {
  title: string;
  items: MoreItem[];
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
    NotificationsButtonComponent,
  ],
})
export class MorePage implements OnInit {
  moreSections: MoreSection[] = [];

  showDonateButton: boolean = false;
  userFirstInitial: string | null = null;
  showVersionDetails = false;

  constructor(
    private router: Router,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private onboardingService: OnboardingService,
    private sharingService: SharingService,
    readonly appVersion: AppVersionService,
    private appRate: AppRateService
  ) {}

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
    const firstName = this.onboardingService.getUserFirstName();
    if (firstName && firstName.trim().length > 0) {
      this.userFirstInitial = firstName.trim().charAt(0).toUpperCase();
    }
    this.moreSections = this.buildMoreSections();
  }

  private buildMoreSections(): MoreSection[] {
    const explore: MoreSection = {
      title: 'Explore',
      items: [
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
      ],
    };

    const support: MoreSection = {
      title: 'Support & feedback',
      items: [
        {
          name: 'Support request',
          icon: 'ribbon-outline',
          route: '/assistance/support-request',
        },
        {
          name: `Rate ${LOVE_INC_PUBLIC_NAME}`,
          icon: 'star-outline',
          handler: () => this.openRateApp(),
        },
        {
          name: `Share ${LOVE_INC_PUBLIC_NAME}`,
          icon: 'share-outline',
          handler: () => this.openShareApp(),
        },
      ],
    };

    const youItems: MoreItem[] = [
      {
        name: 'My Profile',
        icon: 'person-circle-outline',
        route: '/tabs/profile',
      },
    ];

    if (this.onboardingService.canShowVolunteerRequestUi()) {
      youItems.push({
        name: 'Open Volunteer Positions',
        icon: 'hand-right-outline',
        route: '/tabs/volunteer-positions',
      });
    }

    const you: MoreSection = {
      title: 'My account',
      items: youItems,
    };

    const legal: MoreSection = {
      title: 'Legal',
      items: [
        {
          name: 'Privacy Policy',
          icon: 'shield-outline',
          externalUrl: LOVE_INC_PRIVACY_POLICY_URL,
        },
        {
          name: 'Terms of Use',
          icon: 'document-text-outline',
          externalUrl: LOVE_INC_TERMS_OF_USE_URL,
        },
      ],
    };

    return [explore, you, support, legal];
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  toggleVersionDetails() {
    this.showVersionDetails = !this.showVersionDetails;
  }

  handleItemClick(item: MoreItem) {
    if (item.route) {
      void this.router.navigateByUrl(item.route);
    } else if (item.externalUrl) {
      void this.openExternalUrl(item.externalUrl);
    } else if (item.handler) {
      void Promise.resolve(item.handler());
    }
  }

  private async openExternalUrl(url: string): Promise<void> {
    try {
      await AppLauncher.openUrl({ url });
    } catch (e) {
      console.error('More: openExternalUrl failed', e);
    }
  }

  private async openRateApp(): Promise<void> {
    try {
      await this.appRate.requestNativeReview();
    } catch (e) {
      console.error('More: in-app review failed', e);
      try {
        await this.appRate.openStoreListing();
      } catch (e2) {
        console.error('More: open store listing fallback failed', e2);
      }
    }
  }

  private async openShareApp(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      let storeUrl: string | undefined;
      if (platform === 'ios') {
        storeUrl = environment.iosAppStoreListingUrl?.trim() || undefined;
      } else if (platform === 'android') {
        storeUrl = environment.androidPlayStoreListingUrl?.trim() || undefined;
      }
      await this.sharingService.shareContent({
        title: 'Love INC',
        subject: 'Love INC app',
        htmlContent:
          '<p>Check out the Love INC mobile app for stories, tools, and ways to connect with our community.</p>',
        url: storeUrl,
      });
    } catch (e) {
      console.error('More: openShareApp failed', e);
    }
  }
}
