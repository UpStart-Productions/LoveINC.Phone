import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  notificationsOutline, 
  settingsOutline, 
  helpCircleOutline,
  logOutOutline,
  chevronForwardOutline,
  mailOutline,
  callOutline,
  heartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton
  ],
})
export class ProfilePage {
  userProfile = {
    name: 'Guest User',
    email: '',
    phone: '',
    memberSince: new Date().toLocaleDateString()
  };

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {
    addIcons({ 
      personOutline, 
      notificationsOutline, 
      settingsOutline, 
      helpCircleOutline,
      logOutOutline,
      chevronForwardOutline,
      mailOutline,
      callOutline,
      heartOutline
    });
  }

  navigateToSettings() {
    // TODO: Navigate to settings page
    console.log('Navigate to Settings');
  }

  navigateToNotifications() {
    // TODO: Navigate to notifications page
    console.log('Navigate to Notifications');
  }

  navigateToHelp() {
    // TODO: Navigate to help page
    console.log('Navigate to Help');
  }

  logout() {
    // TODO: Implement logout functionality
    console.log('Logout');
  }

  resetOnboarding() {
    this.onboardingService.clearOnboarding();
    this.router.navigate(['/onboarding/step1']);
  }
}
