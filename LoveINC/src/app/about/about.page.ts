import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, mapOutline, mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-about',
  templateUrl: 'about.page.html',
  styleUrls: ['about.page.scss'],
  imports: [
    CommonModule,
    RouterModule,
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
    IonButton,
    IonButtons
  ],
})
export class AboutPage {
  impactStats = [
    { number: '500+', label: 'Families Helped' },
    { number: '1,000+', label: 'Needs Met' },
    { number: '40+', label: 'Church Partners' },
    { number: '100+', label: 'Active Volunteers' }
  ];

  constructor(private router: Router) {
    addIcons({ personCircleOutline, mapOutline, mailOutline });
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  navigateToChurchMap() {
    console.log('Navigating to church map...');
    this.router.navigate(['/tabs/church-map']).then(
      (success) => {
        console.log('Navigation successful:', success);
      },
      (error) => {
        console.error('Navigation error:', error);
      }
    );
  }
}
