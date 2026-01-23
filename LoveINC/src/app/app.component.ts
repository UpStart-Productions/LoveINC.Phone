import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { OnboardingService } from './services/onboarding.service';
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
  personCircleOutline,
  callOutline,
  notificationsOutline,
  settingsOutline,
  helpCircleOutline,
  logOutOutline,
  chevronForwardOutline,
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
  restaurantOutline,
  medicalOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
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
      personCircleOutline,
      callOutline,
      notificationsOutline,
      settingsOutline,
      helpCircleOutline,
      logOutOutline,
      chevronForwardOutline,
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
      restaurantOutline,
      medicalOutline,
      // Alias for house icon
      'house-outline': homeOutline,
    });
  }
}
