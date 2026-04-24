import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { ContactAssistanceFormComponent } from '../components/contact-assistance-form/contact-assistance-form.component';

@Component({
  selector: 'app-assistance-signup',
  templateUrl: './assistance-signup.page.html',
  styleUrls: ['./assistance-signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    ContactAssistanceFormComponent,
    RouterLink,
  ],
})
export class AssistanceSignupPage {
  constructor(private router: Router) {}

  async ionViewWillEnter(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    } catch {
      // Keyboard plugin not available (e.g. web)
    }
  }

  async ionViewWillLeave(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch {
      // Keyboard plugin not available
    }
  }

  onFormSubmitted() {
    this.router.navigate(['/assistance/thank-you']);
  }
}
