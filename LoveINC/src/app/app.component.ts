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
import { PushRegistrationService } from './services/push-registration.service';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { mapNotificationMetaToContentType } from './utils/notification-deeplink';
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
  searchOutline,
  documentTextOutline,
  documentOutline,
  createOutline,
  addOutline,
  trashOutline,
  pricetagOutline,
  libraryOutline,
  restaurantOutline,
  medicalOutline,
  bookOutline,
  playCircleOutline,
  playOutline,
  bookmarkOutline,
  shareOutline,
  chatbubbleOutline,
  refreshOutline,
  codeOutline,
  waterOutline,
  checkmarkDoneOutline,
  calculatorOutline,
  walletOutline,
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
  private static splashScreenHidden = false;
  private appStateListener: any;

  constructor(
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private appUserData: AppUserDataService,
    private deviceId: DeviceIdService,
    private platformApi: PlatformApiService,
    private platform: Platform,
    private grovlinkDb: GrovLinkDatabaseService,
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

    // Hide splash screen only on initial app launch, not when app comes back to foreground
    if (!AppComponent.splashScreenHidden) {
      try {
        await SplashScreen.hide();
        AppComponent.splashScreenHidden = true;
      } catch (error) {
        console.log('Splash screen not available (likely running in browser)');
        AppComponent.splashScreenHidden = true;
      }
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
    this.platformApi
      .getAppUser({
        deviceId: this.deviceId.getDeviceId(),
        email: this.onboardingService.getOnboardingData()?.email ?? profile.email,
      })
      .subscribe({
        next: (res) => {
          if (res?.user) {
            this.appUserData.setData(res.user);
            // Sync server profile to local if local is empty
            const p = this.userProfileService.getProfile();
            if (!p.email?.trim() && res.user.email) {
              this.userProfileService.setProfile({
                firstName: res.user.firstName ?? '',
                lastName: res.user.lastName ?? '',
                email: res.user.email ?? '',
              });
            }
          } else {
            this.appUserData.clear();
          }
        },
        error: (err) => {
          console.warn('App: getAppUser failed', err);
          this.appUserData.clear();
        },
      });

    // Pre-initialize GrovLink database so SQLite is ready when notifications are used
    this.grovlinkDb.getDbConnection().catch((err) => {
      console.warn('GrovLink DB init deferred:', err);
    });

    // Listen for app state changes to prevent splash screen from showing on resume
    try {
      this.appStateListener = await App.addListener('appStateChange', async (state) => {
        if (state.isActive && AppComponent.splashScreenHidden) {
          // App became active - ensure splash screen stays hidden
          try {
            await SplashScreen.hide();
          } catch (error) {
            // Ignore errors - splash might already be hidden
          }
          // Re-initialize DB connections and service unlock state after resume
          // (iOS may have suspended or invalidated connections when backgrounded)
          try {
            await this.grovlinkDb.getDbConnection();
          } catch (err) {
            console.warn('GrovLink DB reconnect on resume:', err);
          }
          try {
            await this.serviceUnlock.ensureInitialized(true);
          } catch (err) {
            console.warn('Service unlock re-init on resume:', err);
          }
        }
      });
    } catch (error) {
      // App plugin might not be available in browser
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
      searchOutline,
      documentTextOutline,
      documentOutline,
      createOutline,
      addOutline,
      trashOutline,
      pricetagOutline,
      libraryOutline,
      restaurantOutline,
      medicalOutline,
      bookOutline,
      playCircleOutline,
      playOutline,
      bookmarkOutline,
      shareOutline,
      chatbubbleOutline,
      refreshOutline,
      codeOutline,
      waterOutline,
      checkmarkDoneOutline,
      calculatorOutline,
      walletOutline,
      // Service Unlock Icons
      qrCodeOutline,
      scanOutline,
      keyOutline,
      lockClosedOutline,
      checkmarkCircle,
      ticketOutline,
      // Alias for house icon
      'house-outline': homeOutline,
    });
  }
}
