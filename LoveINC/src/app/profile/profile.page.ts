import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonBackButton,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';

type UserType = 'client' | 'donor' | 'volunteer';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
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
    IonBackButton,
    IonSegment,
    IonSegmentButton
  ],
})
export class ProfilePage {
  selectedUserType: UserType = 'client';
  
  userProfile = {
    name: 'Guest User',
    email: '',
    phone: '',
    memberSince: new Date().toLocaleDateString()
  };

  // Client-specific data
  clientData = {
    engagement: {
      classesCompleted: 2,
      servicesUsed: 5,
      progressGoals: 1,
      livesImpacted: 0
    }
  };

  // Donor-specific data
  donorData = {
    engagement: {
      totalDonated: 1250,
      donationsMade: 8,
      familiesHelped: 12,
      livesImpacted: 12
    }
  };

  // Volunteer-specific data
  volunteerData = {
    engagement: {
      volunteerHours: 45,
      eventsAttended: 8,
      familiesServed: 120,
      livesImpacted: 120
    }
  };

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {}

  get currentEngagement() {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement;
      case 'donor':
        return this.donorData.engagement;
      case 'volunteer':
        return this.volunteerData.engagement;
    }
  }

  get engagementLabels() {
    switch (this.selectedUserType) {
      case 'client':
        return {
          label1: 'Classes Completed',
          label2: 'Services Used',
          label3: 'Progress Goals',
          label4: 'Lives Impacted'
        };
      case 'donor':
        return {
          label1: 'Total Donated',
          label2: 'Donations Made',
          label3: 'Families Helped',
          label4: 'Lives Impacted'
        };
      case 'volunteer':
        return {
          label1: 'Volunteer Hours',
          label2: 'Events Attended',
          label3: 'Families Served',
          label4: 'Lives Impacted'
        };
    }
  }

  get engagementValue1(): number | string {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement.classesCompleted;
      case 'donor':
        return this.donorData.engagement.totalDonated;
      case 'volunteer':
        return this.volunteerData.engagement.volunteerHours;
    }
  }

  get engagementValue2(): number {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement.servicesUsed;
      case 'donor':
        return this.donorData.engagement.donationsMade;
      case 'volunteer':
        return this.volunteerData.engagement.eventsAttended;
    }
  }

  get engagementValue3(): number {
    switch (this.selectedUserType) {
      case 'client':
        return this.clientData.engagement.progressGoals;
      case 'donor':
        return this.donorData.engagement.familiesHelped;
      case 'volunteer':
        return this.volunteerData.engagement.familiesServed;
    }
  }

  get engagementValue4(): number {
    return this.currentEngagement.livesImpacted;
  }

  get isDonorValue1(): boolean {
    return this.selectedUserType === 'donor';
  }

  navigateToSettings() {
    console.log('Navigate to Settings');
  }

  navigateToNotifications() {
    console.log('Navigate to Notifications');
  }

  navigateToHelp() {
    console.log('Navigate to Help');
  }

  navigateToSandbox() {
    this.router.navigate(['/sandbox']);
  }

  logout() {
    console.log('Logout');
  }

  resetOnboarding() {
    this.onboardingService.clearOnboarding();
    this.router.navigate(['/onboarding/step1']).then(() => {
      window.location.reload();
    });
  }
}
