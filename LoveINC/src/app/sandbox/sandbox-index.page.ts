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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-sandbox-index',
  templateUrl: './sandbox-index.page.html',
  styleUrls: ['./sandbox-index.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class SandboxIndexPage {
  sandboxPages = [
    {
      title: 'Donor Experience',
      description: 'Impact visualization, urgent needs, donation flow',
      route: '/sandbox/donor',
      icon: 'gift-outline',
      color: '#eaa535'
    },
    {
      title: 'Client Experience',
      description: 'Available services, quick help, success stories',
      route: '/sandbox/client',
      icon: 'hand-right-outline',
      color: '#349394'
    },
    {
      title: 'Volunteer Experience',
      description: 'This weekend opportunities, impact tracking, community',
      route: '/sandbox/volunteer',
      icon: 'heart-outline',
      color: '#ef4444'
    },
    {
      title: 'Universal Features',
      description: 'Gamification, social proof, personalization ideas',
      route: '/sandbox/universal',
      icon: 'star-outline',
      color: '#8b5cf6'
    }
  ];

  constructor(private router: Router) {}

  navigateTo(page: { route: string }) {
    this.router.navigate([page.route]);
  }
}
