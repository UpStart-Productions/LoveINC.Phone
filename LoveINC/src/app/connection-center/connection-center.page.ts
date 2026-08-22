import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  NavController,
} from '@ionic/angular/standalone';
import { ContentCardComponent } from '../components/content-card/content-card.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { LOVE_INC_OFFICE_TEL } from '../shared/love-inc-contact.constants';
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
    IonContent,
    IonButton,
    IonIcon,
    ContentCardComponent,
    NotificationsButtonComponent,
    AppBackButtonComponent,
  ],
})
export class ConnectionCenterPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(IonContent) private ionContent?: IonContent;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly navController = inject(NavController);
  private readonly donateButtonService = inject(DonateButtonService);
  private readonly donateActionSheetService = inject(DonateActionSheetService);
  private readonly cdr = inject(ChangeDetectorRef);

  private edgeScrollEl: HTMLElement | null = null;
  private edgeScrollListener: (() => void) | null = null;

  showDonateButton = false;
  edgeHeaderScrolled = false;

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

  ionViewWillEnter(): void {
    void this.syncEdgeHeaderScrollListener();
  }

  ngAfterViewInit(): void {
    void this.syncEdgeHeaderScrollListener();
  }

  ngOnDestroy(): void {
    this.teardownEdgeHeaderScrollListener();
  }

  openDonateMenu() {
    void this.donateActionSheetService.openDonateActionSheet();
  }

  callConnectionCenter(): void {
    window.open(`tel:${LOVE_INC_OFFICE_TEL}`, '_self');
  }

  onGetStarted() {
    void navigateAppForward(this.navController, this.router, ['/tabs/assistance/signup']);
  }

  onHaveQRCode() {
    void navigateAppForward(this.navController, this.router, ['/tabs/service-unlock/scan']);
  }

  /** Fade header chrome in on scroll (events / classes / content-plan pattern). */
  private async syncEdgeHeaderScrollListener(): Promise<void> {
    this.teardownEdgeHeaderScrollListener();

    if (!this.ionContent) {
      this.edgeHeaderScrolled = false;
      this.cdr.markForCheck();
      return;
    }

    const scrollEl = await this.ionContent.getScrollElement();
    const onScroll = (): void => {
      const scrolled = scrollEl.scrollTop > 5;
      if (this.edgeHeaderScrolled === scrolled) {
        return;
      }
      this.edgeHeaderScrolled = scrolled;
      this.cdr.markForCheck();
    };

    this.edgeScrollEl = scrollEl;
    this.edgeScrollListener = onScroll;
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  private teardownEdgeHeaderScrollListener(): void {
    if (this.edgeScrollEl && this.edgeScrollListener) {
      this.edgeScrollEl.removeEventListener('scroll', this.edgeScrollListener);
    }
    this.edgeScrollEl = null;
    this.edgeScrollListener = null;
  }
}
