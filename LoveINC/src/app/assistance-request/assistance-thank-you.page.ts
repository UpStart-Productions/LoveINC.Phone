import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
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
  ],
})
export class AssistanceThankYouPage {
  constructor(private router: Router) {}

  onDone() {
    this.router.navigate(['/tabs/home']);
  }
}
