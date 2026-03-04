import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { startOfDay } from 'date-fns';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { CardComponent, CardActionIcon } from '../components/card/card.component';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardType } from '../models/home-card.model';
import { CardFormattingService } from '../services/card-formatting.service';
import { UserTypeCardComponent, UserType } from '../components/user-type-card/user-type-card.component';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { DonateButtonService } from '../services/donate-button.service';
import { SharingService } from '../services/sharing/sharing.service';
import { PlatformApiService } from '../services/platform/platform-api.service';
import type { PlatformCta, PlatformClass, PlatformEvent, PlatformHomeFeedItem } from '../services/platform/types';
import { HomeCtaRowComponent } from '../components/home-cta-row/home-cta-row.component';
import { VerseOfTheDayWidgetComponent } from '../components/verse-of-the-day-widget/verse-of-the-day-widget.component';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { VolunteerActionSheetService } from '../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';
import { PushRegistrationService } from '../services/push-registration.service';

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
    HomeCtaRowComponent,
    VerseOfTheDayWidgetComponent,
    NotificationsButtonComponent,
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
    private volunteerActionSheetService: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService,
    private pushRegistration: PushRegistrationService
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

  ionViewDidEnter(): void {
    // Request push permission when user actually lands on home (after onboarding).
    // ionViewDidEnter fires when the view is active, not during preload.
    // Short delay so user sees the home screen before the prompt.
    setTimeout(() => this.pushRegistration.register().catch(() => {}), 500);
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

  loadCards() {
    forkJoin({
      homeFeed: this.platformApi.getHomeFeed(),
      events: this.platformApi.getEvents(),
      classes: this.platformApi.getClasses(),
    })
      .pipe(
        map(({ homeFeed, events, classes }) => {
          const today = startOfDay(new Date()).getTime();
          const eventMap = new Map<string, PlatformEvent>((events ?? []).map((e) => [e.id, e]));
          const classMap = new Map<string, PlatformClass>((classes ?? []).map((c) => [c.id, c]));
          const cards = (homeFeed ?? [])
            .filter((item): item is typeof item & { type: CardType } =>
              this.isSupportedCardType(item.type))
            .filter((item) => !this.isCtaCardType(item.type))
            .filter((item) => this.isNotPastEventOrClass(item, today))
            .map((item) => this.mapFeedItemToHomeCard(item, eventMap, classMap))
            .sort((a, b) => a.priority - b.priority);
          return this.limitImpactStories(cards, 1);
        })
      )
      .subscribe({
        next: (cards) => {
          this.cards = cards;
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

  /** Limit impact stories to a maximum count (keeps first by priority). */
  private limitImpactStories(cards: HomeCard[], maxImpact: number): HomeCard[] {
    let impactCount = 0;
    return cards.filter((card) => {
      if (card.type === 'impact') {
        impactCount++;
        return impactCount <= maxImpact;
      }
      return true;
    });
  }

  /** Exclude CTA types from full cards; they are shown as small cards at the top. */
  private isCtaCardType(type: CardType): boolean {
    const ctaTypes: CardType[] = ['donation-drive', 'volunteer', 'fundraiser', 'awareness'];
    return ctaTypes.includes(type);
  }

  /** Exclude events and classes that are in the past (before today). Other types are kept. */
  private isNotPastEventOrClass(item: PlatformHomeFeedItem & { type: CardType }, todayMs: number): boolean {
    if (item.type !== 'event' && item.type !== 'class') return true;
    const startDate = item.startDate;
    if (!startDate) return true;
    return new Date(startDate).getTime() >= todayMs;
  }

  private mapFeedItemToHomeCard(
    item: PlatformHomeFeedItem & { type: CardType },
    eventMap: Map<string, PlatformEvent>,
    classMap: Map<string, PlatformClass>
  ): HomeCard {
    const formatted = this.cardFormatting.formatForCard(item, item.type);
    let positions: Array<{ id: string; title?: string; shortDescription?: string; description?: string; schedule?: string }> = [];
    let address: string | null = null;

    if (item.type === 'event') {
      const event = eventMap.get(item.id);
      if (event) {
        const raw = (event.volunteerPositions ?? (event as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
        positions = raw.map((p) => {
          const id = p['id'] as string;
          const title = (p['title'] ?? p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
          const shortDescription = (p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
          const description = (p['description'] ?? p['description']) as string | undefined;
          return { id, title, shortDescription, description, schedule: this.scheduleFormatting.getPositionSchedule(p) };
        });
        address = event.address ? this.formatAddress(event.address) : null;
      }
    } else if (item.type === 'class') {
      const cls = classMap.get(item.id);
      if (cls) {
        const raw = (cls.volunteerPositions ?? (cls as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
        positions = raw.map((p) => {
          const id = p['id'] as string;
          const title = (p['title'] ?? p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
          const shortDescription = (p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
          const description = (p['description'] ?? p['description']) as string | undefined;
          return { id, title, shortDescription, description, schedule: this.scheduleFormatting.getPositionSchedule(p) };
        });
        address = cls.address ? this.formatAddress(cls.address) : null;
      }
    }

    if (!positions.length && !address) {
      const itemRaw = (item.volunteerPositions ?? (item as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
      positions = itemRaw.map((p) => {
        const id = p['id'] as string;
        const title = (p['title'] ?? p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
        const shortDescription = (p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
        const description = (p['description'] ?? p['description']) as string | undefined;
        return { id, title, shortDescription, description, schedule: this.scheduleFormatting.getPositionSchedule(p) };
      });
      address = item.address ? this.formatAddress(item.address) : null;
    }

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
      volunteerPositions: positions.length ? positions : undefined,
      address,
    };
  }

  private formatAddress(addr: { address?: string; city?: string; state?: string; zip?: string }): string {
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ') || '';
  }

  getActionIcons(card: HomeCard): CardActionIcon[] {
    return [
      {
        lucideIcon: 'heart-handshake',
        handler: () => this.onVolunteerClick(card),
        show: !!card.volunteerPositions?.length,
        buttonClass: 'volunteer-button',
      },
    ];
  }

  async onVolunteerClick(card: HomeCard) {
    if (!card.volunteerPositions?.length) return;
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: card.title,
      address: card.address ?? null,
      positions: card.volunteerPositions,
      scheduleFallback: card.subtitle ?? undefined,
    });
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
