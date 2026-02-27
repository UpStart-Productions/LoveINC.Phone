import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { startOfDay } from 'date-fns';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardType } from '../models/home-card.model';
import { CardFormattingService } from '../services/card-formatting.service';
import { UserTypeCardComponent, UserType } from '../components/user-type-card/user-type-card.component';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { DonateButtonService } from '../services/donate-button.service';
import { SharingService } from '../services/sharing/sharing.service';
import { AlertsModalService } from '../services/alerts-modal.service';
import { PlatformApiService } from '../services/platform/platform-api.service';
import type { PlatformCta, PlatformHomeFeedItem } from '../services/platform/types';
import { HomeCtaRowComponent } from '../components/home-cta-row/home-cta-row.component';

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
    UserTypeCardComponent,
    HomeCtaRowComponent
  ],
})
export class HomePage implements OnInit {
  cards: HomeCard[] = [];
  welcomeTitle: string = 'Welcome to Love INC.';
  selectedUserTypes: UserType[] = [];
  giveCtas: PlatformCta[] = [];
  volunteerCtas: PlatformCta[] = [];
  showDonateButton: boolean = false;

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private platformApi: PlatformApiService,
    private cardFormatting: CardFormattingService,
    private donateActionSheetService: DonateActionSheetService,
    private donateButtonService: DonateButtonService,
    private sharingService: SharingService,
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
    this.loadCards();
    this.loadUserTypes();
    this.loadCtas();
    
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
    
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  loadCtas() {
    this.platformApi.getCtas().subscribe({
      next: (ctas) => {
        const today = startOfDay(new Date()).getTime();
        const active = (c: PlatformCta) => this.isActiveCta(c, today);
        this.giveCtas = ctas
          .filter((c) => this.isGiveCtaType(c.type))
          .filter(active)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        this.volunteerCtas = ctas
          .filter((c) => c.type === 'volunteer_call')
          .filter(active)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },
      error: (err) => {
        console.error('Error loading CTAs:', err);
      },
    });
  }

  private isGiveCtaType(type: string): boolean {
    return type === 'donation_drive' || type === 'fundraiser';
  }

  private isActiveCta(cta: PlatformCta, todayMs: number): boolean {
    if (cta.startDate && new Date(cta.startDate).getTime() > todayMs) return false;
    if (cta.endDate && new Date(cta.endDate).getTime() < todayMs) return false;
    return true;
  }

  get selectedUserTypesForUserCards(): UserType[] {
    return this.selectedUserTypes.filter((t) => t === 'get-help');
  }

  get showGiveCtas(): boolean {
    return this.selectedUserTypes.includes('give') && this.giveCtas.length > 0;
  }

  get showVolunteerCtas(): boolean {
    return this.selectedUserTypes.includes('volunteer') && this.volunteerCtas.length > 0;
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
        const today = startOfDay(new Date()).getTime();
        this.cards = items
          .filter((item): item is typeof item & { type: CardType } =>
            this.isSupportedCardType(item.type))
          .filter((item) => this.isNotPastEventOrClass(item, today))
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

  /** Exclude events and classes that are in the past (before today). Other types are kept. */
  private isNotPastEventOrClass(item: PlatformHomeFeedItem & { type: CardType }, todayMs: number): boolean {
    if (item.type !== 'event' && item.type !== 'class') return true;
    const startDate = item.startDate;
    if (!startDate) return true;
    return new Date(startDate).getTime() >= todayMs;
  }

  private mapFeedItemToHomeCard(item: PlatformHomeFeedItem & { type: CardType }): HomeCard {
    const formatted = this.cardFormatting.formatForCard(item, item.type);
    return {
      id: formatted.id,
      type: formatted.type,
      photoUrl: formatted.photoUrl,
      title: formatted.title,
      subtitle: formatted.subtitle,
      shortDescription: formatted.description,
      link: `/tabs/content-detail/${this.getContentDetailType(formatted.type)}/${formatted.id}`,
      priority: item.priority,
      badge: formatted.badge,
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
