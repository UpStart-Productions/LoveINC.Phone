import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
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
    ContactAssistanceFormComponent,
    AppBackButtonComponent]})
export class AssistanceSignupPage {
  constructor(private router: Router) {}

  onFormSubmitted() {
    this.router.navigate(['/tabs/assistance/thank-you']);
  }
}
