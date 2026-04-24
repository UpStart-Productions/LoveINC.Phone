import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';
import { UserProfileService } from '../services/user-profile.service';
import { LOVE_INC_OFFICE_TEL } from '../shared/love-inc-contact.constants';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-assistance-thank-you',
  templateUrl: './assistance-thank-you.page.html',
  styleUrls: ['./assistance-thank-you.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
  ],
})
export class AssistanceThankYouPage {
  constructor(
    private router: Router,
    private userProfile: UserProfileService,
    private onboarding: OnboardingService
  ) {}

  /** In-content line below the hero: "Hello {firstName}," with profile → onboarding fallbacks. */
  get greetingLine(): string {
    const fromProfile = this.userProfile.getProfile().firstName?.trim();
    if (fromProfile) {
      return `Hello ${fromProfile},`;
    }
    const fromOnboarding = this.onboarding.getUserFirstName()?.trim();
    if (fromOnboarding) {
      return `Hello ${fromOnboarding},`;
    }
    return 'Hello,';
  }

  callConnectionCenter(): void {
    window.open(`tel:${LOVE_INC_OFFICE_TEL}`, '_self');
  }

  onDone() {
    this.router.navigate(['/tabs/home']);
  }
}
