import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-about',
  templateUrl: 'about.page.html',
  styleUrls: ['about.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
  ],
})
export class AboutPage {
  impactStats = [
    { number: '500+', label: 'Families Helped' },
    { number: '1,000+', label: 'Needs Met' },
    { number: '40+', label: 'Church Partners' },
    { number: '100+', label: 'Active Volunteers' }
  ];

  constructor() {}
}
