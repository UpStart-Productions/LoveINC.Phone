import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, heartOutline, giftOutline, starOutline, peopleOutline, schoolOutline, timeOutline, handLeftOutline, personCircleOutline, gift } from 'ionicons/icons';
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonIcon,
    ExploreContainerComponent
  ],
})
export class HomePage implements OnInit {
  cards: HomeCard[] = [];
  cardTypeLabels = CardTypeLabels;
  cardTypeIcons = CardTypeIcons;
  cardTypeColors = CardTypeColors;
  isDonor: boolean = false;

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private http: HttpClient
  ) {
    addIcons({ calendarOutline, heartOutline, giftOutline, starOutline, peopleOutline, schoolOutline, timeOutline, handLeftOutline, personCircleOutline, gift });
  }

  ngOnInit() {
    this.loadCards();
    
    // Check if user selected 'give' during onboarding
    this.isDonor = this.onboardingService.hasSelectedOption('give');
    
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

  navigateToDonate() {
    // TODO: Navigate to donate page or open donate modal
    console.log('Navigate to Donate');
  }
}
