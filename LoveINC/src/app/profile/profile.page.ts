import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { format } from 'date-fns';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { UserProfileService } from '../services/user-profile.service';
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
import { AlertController } from '@ionic/angular/standalone';
import { ServiceAccessSectionComponent } from '@upstart-productions/service-unlock';
import { Subscription } from 'rxjs';

type UserType = 'client' | 'donor' | 'volunteer';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ServiceAccessSectionComponent,
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
export class ProfilePage implements OnInit, OnDestroy {
  selectedUserType: UserType = 'client';

  profileInfo = { email: '', firstName: '', lastName: '' };
  private profileSub?: Subscription;

  userProfile = {
    name: 'Guest User',
    email: '',
    phone: '',
    memberSince: format(new Date(), 'MMM d, yyyy')
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
    private onboardingService: OnboardingService,
    private userProfileService: UserProfileService,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    const p = this.userProfileService.getProfile();
    this.profileInfo = { email: p.email ?? '', firstName: p.firstName ?? '', lastName: p.lastName ?? '' };
    this.profileSub = this.userProfileService.getProfile$().subscribe((prof) => {
      this.profileInfo = { email: prof.email ?? '', firstName: prof.firstName ?? '', lastName: prof.lastName ?? '' };
      this.updateDisplayProfile();
    });
    this.updateDisplayProfile();
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }

  private updateDisplayProfile(): void {
    const p = this.profileInfo;
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Guest User';
    this.userProfile = {
      ...this.userProfile,
      name,
      email: p.email,
    };
  }

  async editProfile(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Account Information',
      message: 'Email is required for intake validation. Add your email before scanning the QR code.',
      inputs: [
        { name: 'email', type: 'email', placeholder: 'Email', value: this.profileInfo.email },
        { name: 'firstName', type: 'text', placeholder: 'First name (optional)', value: this.profileInfo.firstName },
        { name: 'lastName', type: 'text', placeholder: 'Last name (optional)', value: this.profileInfo.lastName },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (data) => {
            this.userProfileService.setProfile({
              email: (data.email ?? '').trim(),
              firstName: (data.firstName ?? '').trim() || undefined,
              lastName: (data.lastName ?? '').trim() || undefined,
            });
          },
        },
      ],
    });
    await alert.present();
  }

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

  navigateToDeveloperOptions() {
    this.router.navigate(['/tabs/developer-options']);
  }

  logout() {
    console.log('Logout');
  }
}
