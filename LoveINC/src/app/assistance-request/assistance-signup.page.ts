import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-assistance-signup',
  templateUrl: './assistance-signup.page.html',
  styleUrls: ['./assistance-signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonCheckbox,
  ],
})
export class AssistanceSignupPage implements OnInit {
  form = {
    firstName: '',
    lastName: '',
    city: '',
    phone: '',
    email: '',
    reason: '',
    comments: '',
    wantsNewsletter: false,
  };

  constructor(
    private router: Router,
    private onboardingService: OnboardingService
  ) {}

  ngOnInit() {
    const data = this.onboardingService.getOnboardingData();
    if (data?.firstName) this.form.firstName = data.firstName;
    if (data?.lastName) this.form.lastName = data.lastName;
    if (data?.email) this.form.email = data.email;
    if (data?.wantsNewsletter != null) this.form.wantsNewsletter = data.wantsNewsletter;
  }

  canSubmit(): boolean {
    return !!(
      this.form.firstName.trim() &&
      this.form.lastName.trim() &&
      this.form.city &&
      this.form.email.trim() &&
      this.form.reason
    );
  }

  onSubmit() {
    if (!this.canSubmit()) return;
    // TODO: Submit to API
    this.router.navigate(['/assistance/thank-you']);
  }
}
