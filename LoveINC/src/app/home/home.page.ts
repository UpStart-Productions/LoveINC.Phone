import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardTypeLabels, CardTypeIcons, CardTypeColors } from '../models/home-card.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton,
    IonButtons,
    IonIcon,
    CardComponent,
    ExploreContainerComponent
  ],
})
export class HomePage implements OnInit {
  cards: HomeCard[] = [];
  cardTypeLabels = CardTypeLabels;
  cardTypeIcons = CardTypeIcons;
  cardTypeColors = CardTypeColors;
  welcomeTitle: string = 'Welcome to Love INC.';

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadCards();
    
    // Set welcome title based on first name
    const firstName = this.onboardingService.getUserFirstName();
    if (firstName) {
      this.welcomeTitle = `Welcome, ${firstName}!`;
    } else {
      this.welcomeTitle = 'Welcome to Love INC.';
    }
    
    // For testing - add to window for easy access in console
    (window as any).clearOnboarding = () => {
      this.onboardingService.clearOnboarding();
    };
  }

  loadCards() {
    this.http.get<HomeCard[]>('assets/data/home-cards.json').subscribe({
      next: (data) => {
        this.cards = data.sort((a, b) => a.priority - b.priority);
      },
      error: (err) => {
        console.error('Error loading cards:', err);
      }
    });
  }

  navigateToCard(card: HomeCard) {
    this.router.navigate([card.link]);
  }

  resetOnboarding() {
    this.onboardingService.clearOnboarding();
    this.router.navigate(['/onboarding/step1']);
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }
}
