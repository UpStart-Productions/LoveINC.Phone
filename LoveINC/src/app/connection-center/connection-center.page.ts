import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { resolveReturnUrl } from '../shared/utils/navigation-origin.util';
import { isMainTabSegment } from '../shared/utils/navigation-tab-prefix.util';

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
  private readonly route = inject(ActivatedRoute);
  private readonly navController = inject(NavController);
  private readonly donateButtonService = inject(DonateButtonService);
  private readonly donateActionSheetService = inject(DonateActionSheetService);

  showDonateButton = false;

  /** Tab root when stack pop is unavailable (`/tabs/home/connection-center` → `/tabs/home`). */
  get backFallback(): string {
    const fromUrl = resolveReturnUrl(this.route.snapshot.queryParamMap);
    if (fromUrl) {
      return fromUrl;
    }

    const segments = this.router.url.split('?')[0].split('/').filter(Boolean);
    if (segments[0] === 'tabs' && isMainTabSegment(segments[1])) {
      return `/tabs/${segments[1]}`;
    }

    return '/tabs/home';
  }

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    void this.donateActionSheetService.openDonateActionSheet();
  }

  goToGetAssistance() {
    void navigateAppForward(this.navController, this.router, ['/tabs/assistance/intro']);
  }
}
