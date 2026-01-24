import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-onboarding-step1',
  templateUrl: './onboarding-step1.page.html',
  styleUrls: ['./onboarding-step1.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class OnboardingStep1Page {
  constructor(
    private router: Router
  ) {}

  onNext() {
    this.router.navigate(['/onboarding/step2']);
  }
}
