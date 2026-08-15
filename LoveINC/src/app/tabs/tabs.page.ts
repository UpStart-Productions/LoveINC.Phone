import {
  Component,
  EnvironmentInjector,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  ActionSheetController,
  AlertController,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { MainTabBarService } from '../services/main-tab-bar.service';
import { shouldHideMainTabBar } from '../shared/utils';
import { SERVICES_ACTION_SHEET_CLASS } from '../shared/action-sheet-classes';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, LucideAngularModule],
})
export class TabsPage implements OnInit, AfterViewInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  private router = inject(Router);
  private mainTabBarService = inject(MainTabBarService);

  @ViewChild('tabBarTrack', { read: ElementRef }) private tabBarTrackRef?: ElementRef<HTMLElement>;

  private readonly mainTabIds = ['home', 'updates', 'impact-stories', 'tools', 'more'] as const;

  /** Hide main app tab bar when a tool provides its own tab bar (route data: hideMainTabBar). */
  showMainTabBar = signal(true);
  highlightTransform = signal('translate(0px, 0px)');
  highlightVisible = signal(false);
  highlightAnimate = signal(false);

  private routerEventsSub: ReturnType<typeof this.router.events.subscribe> | undefined;
  private tabBarOverrideSub: ReturnType<typeof this.mainTabBarService.hiddenOverride$.subscribe> | undefined;
  private resizeObserver?: ResizeObserver;
  private highlightPositioned = false;
  private activeTabId: string | null = null;

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private donateActionSheetService: DonateActionSheetService
  ) {}

  async ngOnInit() {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    } catch (error) {
      console.log('Keyboard plugin not available');
    }
    this.updateTabBarVisibility();
    this.routerEventsSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateTabBarVisibility();
        this.scheduleTabHighlightUpdate();
      });
    this.tabBarOverrideSub = this.mainTabBarService.hiddenOverride$.subscribe(() => {
      this.updateTabBarVisibility();
    });
  }

  ngAfterViewInit(): void {
    this.scheduleTabHighlightUpdate(false);

    const track = this.tabBarTrackRef?.nativeElement;
    if (track && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.showMainTabBar() && this.highlightPositioned) {
          this.updateTabHighlight(this.highlightAnimate());
        }
      });
      this.resizeObserver.observe(track);
    }
  }

  onTabsDidChange(): void {
    this.scheduleTabHighlightUpdate();
  }

  onTabBarChanged(event: { detail: { tab?: string } }): void {
    this.activeTabId = event.detail.tab ?? null;
    this.scheduleTabHighlightUpdate();
  }

  private scheduleTabHighlightUpdate(animate = this.highlightPositioned): void {
    if (!this.showMainTabBar()) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.updateTabHighlight(animate));
    });
  }

  private updateTabBarVisibility(): void {
    const show = !shouldHideMainTabBar(this.router) && !this.mainTabBarService.isForceHidden();
    const wasHidden = !this.showMainTabBar();
    this.showMainTabBar.set(show);
    if (show && wasHidden) {
      this.highlightPositioned = false;
      this.scheduleTabHighlightUpdate(false);
    }
  }

  private resolveActiveTabId(track: HTMLElement): string | null {
    if (this.activeTabId && this.mainTabIds.includes(this.activeTabId as (typeof this.mainTabIds)[number])) {
      return this.activeTabId;
    }

    const selected = track.querySelector('ion-tab-button.tab-selected') as HTMLElement | null;
    const tabId = selected?.getAttribute('tab');
    if (tabId && this.mainTabIds.includes(tabId as (typeof this.mainTabIds)[number])) {
      return tabId;
    }

    const path = this.router.url.split('?')[0];
    const hrefMap: Record<string, string> = {
      '/tabs/home': 'home',
      '/tabs/updates': 'updates',
      '/tabs/impact-stories': 'impact-stories',
      '/tabs/tools': 'tools',
      '/tabs/more': 'more',
    };

    return hrefMap[path] ?? null;
  }

  private updateTabHighlight(animate: boolean): void {
    const track = this.tabBarTrackRef?.nativeElement;
    if (!track) return;

    const tabId = this.resolveActiveTabId(track);
    if (!tabId) return;

    const tabIndex = this.mainTabIds.indexOf(tabId as (typeof this.mainTabIds)[number]);
    const tabButton = track.querySelectorAll('ion-tab-button').item(tabIndex) as HTMLElement | null;
    if (!tabButton) return;

    const trackRect = track.getBoundingClientRect();
    const buttonRect = tabButton.getBoundingClientRect();
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const sizePx = 2.75 * rootFontSize;

    const x = buttonRect.left + buttonRect.width / 2 - trackRect.left - sizePx / 2;
    const y = buttonRect.top + buttonRect.height / 2 - trackRect.top - sizePx / 2 - 1;

    this.highlightAnimate.set(animate);
    this.highlightTransform.set(`translate(${x}px, ${y}px)`);
    this.highlightVisible.set(true);
    this.highlightPositioned = true;
  }

  private servicesActionSheet?: HTMLIonActionSheetElement;

  async ngOnDestroy() {
    this.routerEventsSub?.unsubscribe();
    this.tabBarOverrideSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    void this.servicesActionSheet?.dismiss();
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch (error) {
      // Keyboard plugin might not be available
    }
  }

  async toggleServicesMenu() {
    if (this.servicesActionSheet) {
      await this.servicesActionSheet.dismiss();
      return;
    }

    const actionSheet = await this.actionSheetController.create({
      header: 'Services at Love INC Newberg',
      cssClass: SERVICES_ACTION_SHEET_CLASS,
      buttons: [
        {
          text: 'Connection Center',
          icon: 'people-circle-outline',
          handler: () => {
            this.router.navigate(['/tabs/connection-center'], { queryParams: { from: 'services' } });
          },
        },
        {
          text: 'Gap Ministries',
          icon: 'assets/custom-icons/hand-helping.svg',
          handler: () => {
            this.router.navigate(['/tabs/gap-ministries'], { queryParams: { from: 'services' } });
          },
        },
        {
          text: 'Transformational Classes',
          icon: 'school-outline',
          handler: () => {
            this.router.navigate(['/tabs/transformation-classes'], { queryParams: { from: 'services' } });
          },
        },
        {
          text: 'J.O.B.S.',
          icon: 'briefcase-outline',
          handler: () => {
            this.router.navigate(['/tabs/jobs-program'], { queryParams: { from: 'services' } });
          },
        },
        {
          text: 'Hesed House',
          icon: 'house-outline',
          handler: () => {
            this.router.navigate(['/tabs/hesed-house'], { queryParams: { from: 'services' } });
          },
        },
        {
          text: 'Prayer Request',
          icon: 'heart-outline',
          handler: () => {
            this.router.navigate(['/tabs/prayer-request'], { queryParams: { from: 'services' } });
          },
        },
        {
          text: 'I Need Assistance',
          icon: 'help-buoy',
          cssClass: 'assistance-button',
          handler: () => {
            void actionSheet.onDidDismiss().then(() => {
              void this.router.navigate(['/tabs/assistance/intro']);
            });
          },
        },
      ],
    });

    this.servicesActionSheet = actionSheet;
    actionSheet.onDidDismiss().then(() => {
      this.servicesActionSheet = undefined;
    });

    await actionSheet.present();
  }

  async showServiceDetail(service: string) {
    const alert = await this.alertController.create({
      header: service,
      message: `You selected: ${service}\n\nService detail page will be implemented soon.`,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
