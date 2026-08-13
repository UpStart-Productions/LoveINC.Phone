import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ContactAssistanceFormComponent } from '../components/contact-assistance-form/contact-assistance-form.component';

@Component({
  selector: 'app-contact',
  templateUrl: 'contact.page.html',
  styleUrls: ['contact.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    ContactAssistanceFormComponent,
  ],
})
export class ContactPage {
  constructor(private router: Router) {}

  onFormSubmitted() {
    this.router.navigate(['/tabs/assistance/thank-you']);
  }
}
