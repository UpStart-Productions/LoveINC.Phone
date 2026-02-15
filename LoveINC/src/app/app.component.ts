import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { OnboardingService } from './services/onboarding.service';
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
  // Profile & Contact Icons
  personOutline,
  personCircle,
  personCircleOutline,
  callOutline,
  notificationsOutline,
  settingsOutline,
  helpCircleOutline,
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
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private static splashScreenHidden = false;
  private appStateListener: any;

  constructor(private onboardingService: OnboardingService) {
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
    // Hide splash screen only on initial app launch, not when app comes back to foreground
    if (!AppComponent.splashScreenHidden) {
      try {
        await SplashScreen.hide();
        AppComponent.splashScreenHidden = true;
      } catch (error) {
        // Splash screen might not be available in web browser
        console.log('Splash screen not available (likely running in browser)');
        AppComponent.splashScreenHidden = true;
      }
    }

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
      // Profile & Contact Icons
      personOutline,
      personCircle,
      personCircleOutline,
      callOutline,
      notificationsOutline,
      settingsOutline,
      helpCircleOutline,
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
      // Alias for house icon
      'house-outline': homeOutline,
    });
  }
}
