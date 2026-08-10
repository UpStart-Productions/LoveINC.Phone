import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ToastController } from '@ionic/angular/standalone';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { UserProfileService } from '../services/user-profile.service';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-prayer-request',
  templateUrl: './prayer-request.page.html',
  styleUrls: ['./prayer-request.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    NotificationsButtonComponent,
    AppBackButtonComponent]})
export class PrayerRequestPage implements OnInit {
  fromServices = false;
  showDonateButton = false;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    prayerRequest: ''};

  constructor(
    private route: ActivatedRoute,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private userProfileService: UserProfileService,
    private onboardingService: OnboardingService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const fromParam = this.route.snapshot.queryParamMap.get('from');
    this.fromServices = fromParam === 'services';
    this.route.queryParamMap.subscribe((params) => {
      this.fromServices = params.get('from') === 'services';
    });
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();

    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    this.form.firstName = profile.firstName?.trim() || onboarding?.firstName?.trim() || '';
    this.form.lastName = profile.lastName?.trim() || onboarding?.lastName?.trim() || '';
    this.form.email = profile.email?.trim() || onboarding?.email?.trim() || '';
  }

  get backDefaultHref(): string {
    return this.fromServices ? '/tabs/services' : '/tabs/home';
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  canSubmit(): boolean {
    return this.form.prayerRequest.trim().length > 0;
  }

  async onSubmit() {
    if (!this.canSubmit()) {
      return;
    }
    const toast = await this.toastController.create({
      message: 'Online submission is not available yet. Thank you for your patience.',
      duration: 3500});
    await toast.present();
  }
}
