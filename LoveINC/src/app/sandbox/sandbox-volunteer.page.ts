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
  selector: 'app-sandbox-volunteer',
  templateUrl: './sandbox-volunteer.page.html',
  styleUrls: ['./sandbox-volunteer.page.scss'],
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
export class SandboxVolunteerPage {
  thisWeekendOpportunities = [
    {
      title: 'Food Pantry Helper',
      date: 'Saturday, Dec 16',
      time: '9:00 AM - 12:00 PM',
      location: 'First Baptist Church',
      spotsLeft: 2,
      description: 'Help distribute groceries to families in need',
      urgent: true
    },
    {
      title: 'Winter Coat Drive',
      date: 'Saturday, Dec 16',
      time: '10:00 AM - 2:00 PM',
      location: 'Community Center',
      spotsLeft: 5,
      description: 'Sort and organize donated winter coats',
      urgent: false
    }
  ];

  volunteerImpact = {
    totalHours: 45,
    familiesServed: 120,
    eventsAttended: 8,
    streak: 5
  };

  perfectMatches = [
    {
      title: 'Financial Coach Needed',
      description: 'Help families learn budgeting skills',
      skill: 'Finance',
      frequency: 'Weekly',
      match: 95
    },
    {
      title: 'Food Pantry - Your Regular Spot',
      description: 'You\'ve volunteered here 5 times!',
      skill: 'Food Service',
      frequency: 'Saturdays',
      match: 100
    }
  ];

  volunteerSpotlight = {
    name: 'John',
    hours: 200,
    quote: 'Volunteering with Love INC has been the most rewarding experience. Seeing families get back on their feet makes it all worth it.',
    photoUrl: 'assets/photos/placeholder.jpg'
  };

  teamChallenges = [
    {
      title: 'Saturday Squad',
      description: '5 volunteers needed this week',
      current: 3,
      total: 5,
      deadline: '2 days'
    }
  ];

  constructor(private router: Router) {}

  signUp(opportunity: any) {
    console.log('Sign up for:', opportunity);
    // Would navigate to sign-up flow
  }
}
