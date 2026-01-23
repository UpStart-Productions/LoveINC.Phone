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
  IonProgressBar,
  IonBadge
} from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';

@Component({
  selector: 'app-sandbox-donor',
  templateUrl: './sandbox-donor.page.html',
  styleUrls: ['./sandbox-donor.page.scss'],
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
    IonProgressBar,
    IonBadge,
    CardComponent
  ]
})
export class SandboxDonorPage {
  impactMetrics = {
    totalDonated: 1250,
    familiesHelped: 12,
    mealsProvided: 240,
    classesFunded: 8
  };

  urgentNeeds = [
    {
      title: '5 Families Need Groceries This Week',
      current: 3,
      total: 5,
      amountNeeded: 250,
      amountRaised: 150
    },
    {
      title: 'Winter Coat Drive',
      current: 45,
      total: 50,
      amountNeeded: 500,
      amountRaised: 450
    }
  ];

  quickDonateAmounts = [25, 50, 100, 250];

  impactStories = [
    {
      title: 'Sarah\'s Story',
      description: 'Sarah received groceries and financial coaching thanks to donors like you',
      photoUrl: 'assets/photos/placeholder.jpg'
    },
    {
      title: 'The Martinez Family',
      description: 'Your donations helped them complete Financial Peace University',
      photoUrl: 'assets/photos/placeholder.jpg'
    }
  ];

  constructor(private router: Router) {}

  navigateToDonate() {
    this.router.navigate(['/tabs/donate-money']);
  }
}
