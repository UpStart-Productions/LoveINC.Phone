import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardType, CardTypeLabels, CardTypeIcons, CardTypeColors } from '../models/home-card.model';
import { UserTypeCardComponent, UserType } from '../components/user-type-card/user-type-card.component';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { SharingService } from '../services/sharing/sharing.service';
import { AlertsModalService } from '../services/alerts-modal.service';
import { PlatformApiService } from '../services/platform/platform-api.service';

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
    private platformApi: PlatformApiService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private alertsModalService: AlertsModalService
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

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  loadCards() {
    this.platformApi.getHomeFeed().subscribe({
      next: (items) => {
        this.cards = items
          .filter((item): item is typeof item & { type: CardType } =>
            this.isSupportedCardType(item.type))
          .map((item) => this.mapFeedItemToHomeCard(item))
          .sort((a, b) => a.priority - b.priority);
      },
      error: (err) => {
        console.error('Error loading home feed:', err);
      },
    });
  }

  private isSupportedCardType(type: string): type is CardType {
    const supported: CardType[] = [
      'event', 'class', 'impact', 'donation-drive', 'volunteer', 'fundraiser', 'awareness',
    ];
    return supported.includes(type as CardType);
  }

  private mapFeedItemToHomeCard(item: {
    id: string;
    type: string;
    photoUrl?: string;
    title: string;
    subtitle?: string;
    shortDescription?: string;
    priority: number;
  }): HomeCard {
    const resolvedPhoto = item.photoUrl
      ? this.platformApi.resolveUploadUrl(item.photoUrl) || item.photoUrl
      : '';
    return {
      id: item.id,
      type: item.type as CardType,
      photoUrl: resolvedPhoto,
      title: item.title,
      subtitle: item.subtitle ?? '',
      shortDescription: item.shortDescription ?? item.subtitle ?? '',
      link: `/tabs/content-detail/${this.getContentDetailType(item.type)}/${item.id}`,
      priority: item.priority,
    };
  }

  private getContentDetailType(apiType: string): string {
    const map: Record<string, string> = {
      event: 'event',
      class: 'class',
      impact: 'impact-story',
      'donation-drive': 'donation-drive',
      volunteer: 'volunteer',
      fundraiser: 'fundraiser',
      awareness: 'awareness',
    };
    return map[apiType] ?? apiType;
  }

  navigateToCard(card: HomeCard) {
    const detailType = this.getContentDetailType(card.type);
    this.router.navigate(['/tabs/content-detail', detailType, card.id]);
  }

  async onShareCard(card: HomeCard) {
    const htmlContent = `
      <h2>${card.title}</h2>
      ${card.subtitle ? `<p><strong>${card.subtitle}</strong></p>` : ''}
      ${card.shortDescription ? `<p>${card.shortDescription}</p>` : ''}
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
