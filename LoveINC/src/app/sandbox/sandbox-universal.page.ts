import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonChip
} from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';

@Component({
  selector: 'app-sandbox-universal',
  templateUrl: './sandbox-universal.page.html',
  styleUrls: ['./sandbox-universal.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonChip,
    CardComponent
  ]
})
export class SandboxUniversalPage {
  communityPulse = {
    familiesHelped: 127,
    volunteersActive: 45,
    donationsToday: 8,
    classesStarted: 3
  };

  recentActivity = [
    { text: '3 new classes started this week', icon: 'school-outline' },
    { text: '15 volunteers signed up today', icon: 'people-outline' },
    { text: 'Sarah completed Financial Peace University', icon: 'trophy-outline' }
  ];

  testimonials = [
    {
      quote: 'Love INC changed my life. The support I received was incredible.',
      author: 'Maria',
      role: 'Client'
    },
    {
      quote: 'Volunteering here has been the most rewarding experience.',
      author: 'John',
      role: 'Volunteer'
    },
    {
      quote: 'Knowing my donations directly help families keeps me giving.',
      author: 'Sarah',
      role: 'Donor'
    }
  ];

  engagementBadges = [
    { name: 'First Donation', icon: 'gift-outline', earned: true },
    { name: '10 Hours Served', icon: 'time-outline', earned: true },
    { name: 'Class Graduate', icon: 'school-outline', earned: false },
    { name: 'Community Champion', icon: 'trophy-outline', earned: false }
  ];

  progressGoals = [
    { label: 'Financial Class', current: 6, total: 8, unit: 'weeks' },
    { label: 'Volunteer Hours', current: 45, total: 100, unit: 'hours' }
  ];

  constructor(private router: Router) {}
}
