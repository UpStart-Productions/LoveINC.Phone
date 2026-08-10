import { Component, EnvironmentInjector, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { signal } from '@angular/core';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonFab, 
  IonFabButton,
  ActionSheetController,
  AlertController
} from '@ionic/angular/standalone';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { shouldHideMainTabBar } from '../shared/utils';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonFab, 
    IonFabButton
  ],
})
export class TabsPage implements OnInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  private router = inject(Router);

  /** Hide main app tab bar when a tool provides its own tab bar (route data: hideMainTabBar). */
  showMainTabBar = signal(true);
  private routerEventsSub: ReturnType<typeof this.router.events.subscribe> | undefined;

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
      .subscribe(() => this.updateTabBarVisibility());
  }

  private updateTabBarVisibility(): void {
    this.showMainTabBar.set(!shouldHideMainTabBar(this.router));
  }

  async ngOnDestroy() {
    this.routerEventsSub?.unsubscribe();
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch (error) {
      // Keyboard plugin might not be available
    }
  }

  async openServicesMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Services at Love INC Newberg',
      cssClass: 'services-action-sheet',
      buttons: [
        {
          text: 'Connection Center',
          icon: 'people-circle-outline',
          handler: () => {
            this.router.navigate(['/tabs/connection-center'], { queryParams: { from: 'services' } });
          }
        },
        {
          text: 'Gap Ministries',
          icon: 'assets/custom-icons/hand-helping.svg',
          handler: () => {
            this.router.navigate(['/tabs/gap-ministries'], { queryParams: { from: 'services' } });
          }
        },
        {
          text: 'Transformational Classes',
          icon: 'school-outline',
          handler: () => {
            this.router.navigate(['/tabs/transformation-classes'], { queryParams: { from: 'services' } });
          }
        },
        {
          text: 'J.O.B.S.',
          icon: 'briefcase-outline',
          handler: () => {
            this.router.navigate(['/tabs/jobs-program'], { queryParams: { from: 'services' } });
          }
        },
        {
          text: 'Hesed House',
          icon: 'house-outline',
          handler: () => {
            this.router.navigate(['/tabs/hesed-house'], { queryParams: { from: 'services' } });
          }
        },
        {
          text: 'Prayer Request',
          icon: 'heart-outline',
          handler: () => {
            this.router.navigate(['/tabs/prayer-request'], { queryParams: { from: 'services' } });
          }
        },
        {
          text: 'I Need Assistance',
          icon: 'help-buoy',
          cssClass: 'assistance-button',
          handler: () => {
            this.router.navigate(['/assistance/intro']);
          }
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  async showServiceDetail(service: string) {
    const alert = await this.alertController.create({
      header: service,
      message: `You selected: ${service}\n\nService detail page will be implemented soon.`,
      buttons: ['OK']
    });

    await alert.present();
  }
}
