import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { OnboardingService } from './services/onboarding.service';
import { UserProfileService } from './services/user-profile.service';
import { AppUserDataService } from './services/app-user-data.service';
import { DeviceIdService } from './services/device-id.service';
import { PlatformApiService } from './services/platform/platform-api.service';
import { GrovLinkDatabaseService } from './services/grovlink-database.service';
import { GoalTrackerDatabaseService } from '@upstart-productions/goal-tracker';
import { SimpleBudgetDatabaseService } from '@upstart-productions/simple-budget';
import { GoalTrackerRefreshService } from './goal-tracker-tabs/services/goal-tracker-refresh.service';
import { PushRegistrationService } from './services/push-registration.service';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { mapNotificationMetaToContentType } from './shared/utils/notification-deeplink';
import { addIcons } from 'ionicons';
import {
  // Tab Bar Icons
  home,
  homeOutline,
  informationCircle,
  informationCircleOutline,
  newspaper,
  newspaperOutline,
  mail,
  mailOutline,
  // Services Menu Icons
  heartOutline,
  peopleCircleOutline,
  constructOutline,
  schoolOutline,
  briefcaseOutline,
  handRightOutline,
  handLeftOutline,
  closeOutline,
  close,
  shirtOutline,
  cubeOutline,
  bicycleOutline,
  // Onboarding Icons
  giftOutline,
  arrowForwardOutline,
  checkmark,
  checkmarkOutline,
  cardOutline,
  // Map & Location Icons
  mapOutline,
  locationOutline,
  globeOutline,
  businessOutline,
  // Profile & Contact Icons
  personOutline,
  personCircle,
  personCircleOutline,
  callOutline,
  notificationsOutline,
  settingsOutline,
  helpCircleOutline,
  helpBuoy,
  logOutOutline,
  chevronForwardOutline,
  chevronBackOutline,
  chevronDownOutline,
  arrowUpOutline,
  arrowDownOutline,
  removeOutline,
  // More Menu Icons
  menu,
  menuOutline,
  // Content Icons
  calendarOutline,
  starOutline,
  peopleOutline,
  timeOutline,
  linkOutline,
  flashOutline,
  pulseOutline,
  alertCircleOutline,
  trophyOutline,
  trophy,
  medalOutline,
  flagOutline,
  repeatOutline,
  repeat,
  statsChartOutline,
  statsChart,
  searchOutline,
  documentTextOutline,
  documentText,
  documentOutline,
  createOutline,
  add,
  addOutline,
  addCircle,
  addCircleSharp,
  trashOutline,
  pricetagOutline,
  libraryOutline,
  restaurantOutline,
  medicalOutline,
  bookOutline,
  playCircleOutline,
  playOutline,
  bookmarkOutline,
  share,
  shareOutline,
  chatbubbleOutline,
  refreshOutline,
  codeOutline,
  waterOutline,
  flameOutline,
  wifiOutline,
  shieldOutline,
  cartOutline,
  carOutline,
  checkmarkDoneOutline,
  ellipseOutline,
  calculatorOutline,
  walletOutline,
  wallet,
  construct,
  eyeOutline,
  eyeOffOutline,
  peopleCircleOutline as peopleCircleOutlineIcon,
  // Service Unlock Icons
  qrCodeOutline,
  scanOutline,
  keyOutline,
  lockClosedOutline,
  checkmarkCircle,
  ticketOutline,
} from 'ionicons/icons';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements OnInit, OnDestroy {
  /** Blocks router until DBs are ready; prevents empty Goal Tracker when live-reload causes WebView reload on resume */
  appReady = false;
  private appStateListener: any;

  constructor(
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private appUserData: AppUserDataService,
    private deviceId: DeviceIdService,
    private platformApi: PlatformApiService,
    private platform: Platform,
    private grovlinkDb: GrovLinkDatabaseService,
    private goalTrackerDb: GoalTrackerDatabaseService,
    private simpleBudgetDb: SimpleBudgetDatabaseService,
    private goalTrackerRefresh: GoalTrackerRefreshService,
    private pushRegistration: PushRegistrationService,
    private router: Router,
    private serviceUnlock: ServiceUnlockService
  ) {
    // Initialize all icons for app-wide use
    this.initializeIcons();
    
    // Expose clearOnboarding to window for easy testing
    // Usage in browser console: clearOnboarding()
    (window as any).clearOnboarding = () => {
      this.onboardingService.clearOnboarding();
      window.location.reload();
    };
    
    console.log('%c🎉 Love INC App Loaded', 'color: #349394; font-size: 16px; font-weight: bold;');
    console.log('%c💡 Testing Tip: Type clearOnboarding() in console to reset onboarding', 'color: #214491; font-size: 12px;');
  }

  async ngOnInit() {
    await this.platform.ready();

    try {
      await SplashScreen.hide();
    } catch (error) {
      console.log('Splash screen not available (likely running in browser)');
    }

    // Sync onboarding name/email to UserProfileService if profile is empty
    const profile = this.userProfileService.getProfile();
    if (!profile.email?.trim() && !profile.firstName?.trim() && !profile.lastName?.trim()) {
      const onboarding = this.onboardingService.getOnboardingData();
      if (onboarding?.firstName || onboarding?.lastName || onboarding?.email) {
        this.userProfileService.setProfile({
          firstName: onboarding.firstName ?? '',
          lastName: onboarding.lastName ?? '',
          email: onboarding.email ?? '',
        });
      }
    }

    // Fetch app user data from API (deviceId + email if available) for UI config
    this.syncAppUserFromApi();

    // Initialize databases before router loads
    await Promise.all([
      this.grovlinkDb.getDbConnection().catch((err) => {
        console.warn('GrovLink DB init deferred:', err);
      }),
      this.goalTrackerDb.getDbConnection().catch((err) => {
        console.warn('Goal Tracker DB init deferred:', err);
      }),
      this.simpleBudgetDb.getDbConnection().catch((err) => {
        console.warn('Simple Budget DB init deferred:', err);
      }),
    ]).catch(() => {});
    this.appReady = true;

    // When app becomes active, reload Goal Tracker. With WebView reload we get a fresh app so we never
    // see isActive: false first; fire on every isActive: true so we catch resume after reload.
    try {
      this.appStateListener = await App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          this.syncAppUserFromApi();
          this.goalTrackerRefresh.requestRefresh();
        }
      });
    } catch (error) {
      console.log('App plugin not available');
    }

    // Request push permission 1 minute after app launch (only if onboarding complete)
    setTimeout(() => {
      if (this.onboardingService.hasCompletedOnboarding()) {
        this.pushRegistration.register().catch(() => {});
      }
    }, 60_000);

    // Handle push notification taps (deep link to content)
    if (Capacitor.isNativePlatform()) {
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action) => {
          const data = action.notification?.data as Record<string, string> | undefined;
          if (!data?.['itemType'] || !data?.['itemId']) return;
          const meta = {
            itemType: data['itemType'],
            itemId: data['itemId'],
            tenantSlug: data['tenantSlug'],
            ctaType: data['ctaType'],
          };
          const routeType = mapNotificationMetaToContentType(meta);
          if (routeType) {
            this.router.navigate(['/tabs/content-detail', routeType, meta.itemId]);
          }
        }
      ).catch((err) => {
        console.warn('Push notification listener not available:', err);
      });
    }
  }

  private syncAppUserFromApi(): void {
    const profile = this.userProfileService.getProfile();
    const email = this.onboardingService.getOnboardingData()?.email ?? profile.email;
    this.platformApi
      .getAppUser({
        deviceId: this.deviceId.getDeviceId(),
        email: email?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res?.user) {
            this.appUserData.setData(res.user);
            // Sync server profile to UserProfileService when API returns
            this.userProfileService.setProfile({
              firstName: res.user.firstName ?? '',
              lastName: res.user.lastName ?? '',
              email: res.user.email ?? '',
            });
          } else {
            // No user from API - fall back to local storage (already in AppUserDataService)
            const local = this.appUserData.getData();
            if (!local) {
              this.appUserData.clear();
            }
          }
        },
        error: () => {
          // On failure, keep existing local storage data (already loaded in AppUserDataService)
          const local = this.appUserData.getData();
          if (!local) {
            this.appUserData.clear();
          }
        },
      });
  }

  async ngOnDestroy() {
    // Remove app state listener
    if (this.appStateListener) {
      try {
        await this.appStateListener.remove();
      } catch (error) {
        // Ignore errors
      }
    }
  }

  private initializeIcons() {
    addIcons({
      // Tab Bar Icons
      home,
      homeOutline,
      informationCircle,
      informationCircleOutline,
      newspaper,
      newspaperOutline,
      mail,
      mailOutline,
      // Services Menu Icons
      heartOutline,
      peopleCircleOutline,
      constructOutline,
      schoolOutline,
      briefcaseOutline,
      handRightOutline,
      handLeftOutline,
      closeOutline,
      close,
      shirtOutline,
      cubeOutline,
      bicycleOutline,
      // Onboarding Icons
      giftOutline,
      arrowForwardOutline,
      checkmark,
      checkmarkOutline,
      cardOutline,
      // Map & Location Icons
      mapOutline,
      locationOutline,
      globeOutline,
      businessOutline,
      // Profile & Contact Icons
      personOutline,
      personCircle,
      personCircleOutline,
      callOutline,
      notificationsOutline,
      settingsOutline,
      helpCircleOutline,
      helpBuoy,
      logOutOutline,
      chevronForwardOutline,
      chevronBackOutline,
      chevronDownOutline,
      arrowUpOutline,
      arrowDownOutline,
      removeOutline,
      // More Menu Icons
      menu,
      menuOutline,
      // Content Icons
      calendarOutline,
      starOutline,
      peopleOutline,
      timeOutline,
      linkOutline,
      flashOutline,
      pulseOutline,
      alertCircleOutline,
      trophyOutline,
      trophy,
      medalOutline,
      flagOutline,
      repeatOutline,
      repeat,
      statsChartOutline,
      statsChart,
      searchOutline,
      documentTextOutline,
      documentText,
      documentOutline,
      createOutline,
      add,
      addOutline,
      addCircle,
      addCircleSharp,
      trashOutline,
      pricetagOutline,
      libraryOutline,
      restaurantOutline,
      medicalOutline,
      bookOutline,
      playCircleOutline,
      playOutline,
      bookmarkOutline,
      share,
      shareOutline,
      chatbubbleOutline,
      refreshOutline,
      codeOutline,
      waterOutline,
      checkmarkDoneOutline,
      ellipseOutline,
      calculatorOutline,
      walletOutline,
      wallet,
      construct,
      eyeOutline,
      eyeOffOutline,
      // Service Unlock Icons
      qrCodeOutline,
      scanOutline,
      keyOutline,
      lockClosedOutline,
      checkmarkCircle,
      ticketOutline,
      flameOutline,
      wifiOutline,
      shieldOutline,
      cartOutline,
      carOutline,
      // Alias for house icon
      'house-outline': homeOutline,
    });
  }
}
