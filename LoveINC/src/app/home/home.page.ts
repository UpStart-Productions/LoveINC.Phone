import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardTypeLabels, CardTypeIcons, CardTypeColors } from '../models/home-card.model';
import { UserTypeCardComponent, UserType } from '../components/user-type-card/user-type-card.component';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { SharingService } from '../services/sharing/sharing.service';

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
    ExploreContainerComponent,
    UserTypeCardComponent
  ],
})
export class HomePage implements OnInit {
  cards: HomeCard[] = [];
  cardTypeLabels = CardTypeLabels;
  cardTypeIcons = CardTypeIcons;
  cardTypeColors = CardTypeColors;
  welcomeTitle: string = 'Welcome to Love INC.';
  selectedUserTypes: UserType[] = [];
  showDonateButton: boolean = false;

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private http: HttpClient,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService
  ) {}

  ngOnInit() {
    this.loadCards();
    this.loadUserTypes();
    
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

  loadUserTypes() {
    const selectedOptions = this.onboardingService.getSelectedOptions();
    // Filter out 'exploring' and map to UserType
    this.selectedUserTypes = selectedOptions
      .filter(option => option !== 'exploring' && ['get-help', 'volunteer', 'give'].includes(option))
      .map(option => option as UserType);
    
    // Show donate button if user selected volunteer or give (donor)
    this.showDonateButton = selectedOptions.includes('volunteer') || selectedOptions.includes('give');
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
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

  async onShareCard(card: HomeCard) {
    const htmlContent = `
      <h2>${card.title}</h2>
      ${card.subtitle ? `<p><strong>${card.subtitle}</strong></p>` : ''}
      ${card.description ? `<p>${card.description}</p>` : ''}
    `;
    
    await this.sharingService.shareContent({
      title: card.title,
      subject: `Love INC: ${card.title}`,
      htmlContent: htmlContent
    });
  }

  resetOnboarding() {
    this.onboardingService.clearOnboarding();
    this.router.navigate(['/onboarding/step1']);
  }
}
