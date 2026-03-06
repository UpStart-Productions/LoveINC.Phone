import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { ServiceAccessSectionComponent } from '@upstart-productions/service-unlock';
import { UserProfileFormModalComponent } from '../components/user-profile-form-modal/user-profile-form-modal.component';
import { Subscription } from 'rxjs';

type UserType = 'client' | 'donor' | 'volunteer';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [
    CommonModule,
    ServiceAccessSectionComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
    IonButtons,
    IonBackButton
  ],
})
export class ProfilePage implements OnInit, OnDestroy {
  selectedUserType: UserType = 'client';

  profileInfo = { email: '', firstName: '', lastName: '' };
  private profileSub?: Subscription;

  userProfile = {
    name: '',
    email: '',
  };

  // Client-specific data (used when My Engagement is re-enabled)
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
    private modalController: ModalController
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
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || '';
    this.userProfile = {
      ...this.userProfile,
      name,
      email: p.email,
    };
  }

  get displayName(): string {
    return [this.profileInfo.firstName, this.profileInfo.lastName].filter(Boolean).join(' ') || '';
  }

  async editProfile(): Promise<void> {
    const modal = await this.modalController.create({
      component: UserProfileFormModalComponent,
      componentProps: {
        headerTitle: 'Your information',
        message: 'Email is required for intake validation.',
        firstName: this.profileInfo.firstName,
        lastName: this.profileInfo.lastName,
        email: this.profileInfo.email,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.userProfileService.setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
    }
  }

  onScanRequested = async (): Promise<void> => {
    if (this.userProfileService.hasCompleteProfile()) {
      this.router.navigate(['/tabs/service-unlock/scan']);
      return;
    }
    const modal = await this.modalController.create({
      component: UserProfileFormModalComponent,
      componentProps: {
        headerTitle: 'Complete your profile',
        message: 'Please enter your first name, last name, and email to scan the QR code.',
        firstName: this.profileInfo.firstName,
        lastName: this.profileInfo.lastName,
        email: this.profileInfo.email,
      },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.userProfileService.setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
      this.router.navigate(['/tabs/service-unlock/scan']);
    }
  };

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

  navigateToSandbox() {
    this.router.navigate(['/sandbox']);
  }

  navigateToDeveloperOptions() {
    this.router.navigate(['/tabs/developer-options']);
  }
}
