import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonList,
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption,
  IonTextarea,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-contact',
  templateUrl: 'contact.page.html',
  styleUrls: ['contact.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem, 
    IonLabel, 
    IonInput, 
    IonSelect, 
    IonSelectOption,
    IonTextarea,
    IonButton
  ],
})
export class ContactPage {
  contactForm = {
    firstName: '',
    lastName: '',
    city: '',
    phone: '',
    email: '',
    reason: '',
    comments: ''
  };

  constructor(private router: Router) {
    addIcons({ personCircleOutline });
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  onSubmit() {
    console.log('Contact form submitted:', this.contactForm);
    // TODO: Implement form submission
  }
}
