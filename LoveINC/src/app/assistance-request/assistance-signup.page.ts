import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-assistance-signup',
  templateUrl: './assistance-signup.page.html',
  styleUrls: ['./assistance-signup.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
  ],
})
export class AssistanceSignupPage {
  constructor(private router: Router) {}

  onSubmit() {
    this.router.navigate(['/assistance/thank-you']);
  }
}
