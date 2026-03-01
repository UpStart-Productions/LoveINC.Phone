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
  selector: 'app-assistance-intro',
  templateUrl: './assistance-intro.page.html',
  styleUrls: ['./assistance-intro.page.scss'],
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
export class AssistanceIntroPage {
  constructor(private router: Router) {}

  onGetStarted() {
    this.router.navigate(['/assistance/signup']);
  }
}
