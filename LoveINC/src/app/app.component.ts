import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { OnboardingService } from './services/onboarding.service';
import { GrovLinkDatabaseService } from './services/grovlink-database.service';
import { PushRegistrationService } from './services/push-registration.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
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
    private platform: Platform,
    private grovlinkDb: GrovLinkDatabaseService,
    private pushRegistration: PushRegistrationService
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
