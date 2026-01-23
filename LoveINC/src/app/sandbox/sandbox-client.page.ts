import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';

@Component({
  selector: 'app-sandbox-client',
  templateUrl: './sandbox-client.page.html',
  styleUrls: ['./sandbox-client.page.scss'],
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
    IonItem,
    IonLabel,
    CardComponent
  ]
})
export class SandboxClientPage implements OnInit {
  servicesAvailableToday = 3;
  quickActions = [
    { label: 'Find Services', icon: 'search-outline', route: '/sandbox/find-services' },
    { label: 'Apply for Help', icon: 'document-text-outline', route: '/tabs/contact' },
    { label: 'Join a Class', icon: 'school-outline', route: '/tabs/transformation-classes' }
  ];

  successStories = [
    {
      name: 'Maria',
      story: 'Love INC helped me get back on my feet after losing my job. The financial classes changed everything.',
      photoUrl: 'assets/photos/placeholder.jpg'
    },
    {
      name: 'James',
      story: 'The food assistance program kept my family fed while I was between jobs. I\'m so grateful.',
      photoUrl: 'assets/photos/placeholder.jpg'
    }
  ];

  personalizedRecommendations = [
    {
      title: 'Financial Peace University',
      subtitle: 'Starts next Monday',
      description: 'Based on your interest in financial help',
      type: 'class',
      available: true
    },
    {
      title: 'Food Pantry Assistance',
      subtitle: 'Available Thursday-Saturday',
      description: 'Weekly groceries for families in need',
      type: 'gap-ministry',
      available: true
    }
  ];

  communityStats = {
    familiesHelped: 500,
    servicesProvided: 1200,
    classesCompleted: 85
  };

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Could load real gap services and count available today
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
