import { Component, OnInit, ViewChild, ViewChildren, QueryList, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, firstValueFrom, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { startOfDay } from 'date-fns';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  NavController,
} from '@ionic/angular/standalone';
import { CardComponent, CardActionIcon } from '../components/card/card.component';
import { OnboardingService } from '../services/onboarding.service';
import { HomeCard, CardType } from '../shared/models/home-card.model';
import { CardFormattingService } from '../services/card-formatting.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { DonateButtonService } from '../services/donate-button.service';
import { SharingService } from '../services/sharing/sharing.service';
import { PlatformApiService } from '../services/platform/platform-api.service';
import type { PlatformCta, PlatformClass, PlatformEvent, PlatformHomeFeedItem, PlatformImpactStory } from '../services/platform/types';
import { HomeCtaRowComponent } from '../components/home-cta-row/home-cta-row.component';
import {
  buildConnectionCenterCtaRow,
  buildGiveNowCtaRow,
  buildVolunteerCtaRow,
  mapPlatformCtaToRow,
  mapHomeCtaRowsToMediaItems,
} from '../components/home-cta-row/home-cta-row.mapper';
import type { HomeCtaRowModel } from '../components/home-cta-row/home-cta-row.model';
import { executeHomeCtaAction } from '../shared/utils/home-cta-action.util';
import type { PeekCarouselMediaItem } from '../components/peek-carousel/peek-carousel.model';
import { PeekCarouselComponent } from '../components/peek-carousel/peek-carousel.component';
import { VerseOfTheDayWidgetComponent } from '../components/verse-of-the-day-widget/verse-of-the-day-widget.component';
import { HomeToolsCarouselComponent } from '../components/home-tools-carousel/home-tools-carousel.component';
import { HeaderActionsComponent } from '../components/header-actions/header-actions.component';
import { VolunteerActionSheetService } from '../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';
import { UserProfileService } from '../services/user-profile.service';
import { DismissedShareAppCardService } from '../services/dismissed-share-app-card.service';
import { CalendarService } from '../services/calendar/calendar.service';
import { MicrolearningThemeWidgetComponent } from '../components/microlearning-theme-widget/microlearning-theme-widget.component';
import { HomeShareAppCardComponent } from '../components/home-share-app-card/home-share-app-card.component';
import { ContentPlanService } from '../content-plan/content-plan.service';
import type { ContentPlanTheme } from '../content-plan/content-plan.model';
import type { PeekCarouselSlideClick } from '../components/peek-carousel/peek-carousel.model';
import { navigateAppForward } from '../shared/utils/navigation-forward.util';
import { OrganizationContextService } from '../services/organization-context.service';

/** When Home has no active events or classes, show up to this many impact stories. */
const HOME_MAX_IMPACT_STORIES = 3;

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
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonButtons,
    CardComponent,
    HomeCtaRowComponent,
    PeekCarouselComponent,
    VerseOfTheDayWidgetComponent,
    HomeToolsCarouselComponent,
    HeaderActionsComponent,
    MicrolearningThemeWidgetComponent,
    HomeShareAppCardComponent,
  ],
})
export class HomePage implements OnInit {
  /** Matches home widget category labels (card margin + ion-card-content padding). */
  readonly microlearningSectionTitleInset = 'calc(var(--app-card-margin) + 1rem)';

  @ViewChild(HomeToolsCarouselComponent)
  private homeToolsCarousel?: HomeToolsCarouselComponent;

  @ViewChild(VerseOfTheDayWidgetComponent)
  private verseHomeWidget?: VerseOfTheDayWidgetComponent;

  @ViewChildren(MicrolearningThemeWidgetComponent)
  private microlearningThemeWidgets?: QueryList<MicrolearningThemeWidgetComponent>;

  cards: HomeCard[] = [];
  homeMicrolearningThemes: ContentPlanTheme[] = [];
  showShareAppCard = false;
  welcomeTitle = 'Welcome to Love INC';
  giveCtas: PlatformCta[] = [];
  volunteerCtas: PlatformCta[] = [];
  platformCtaMediaItems: PeekCarouselMediaItem[] = [];
  showDonateButton = false;

  private readonly organizationContext = inject(OrganizationContextService);

  constructor(
    private onboardingService: OnboardingService,
    private router: Router,
    private navController: NavController,
    private platformApi: PlatformApiService,
    private cardFormatting: CardFormattingService,
    private donateActionSheetService: DonateActionSheetService,
    private donateButtonService: DonateButtonService,
    private sharingService: SharingService,
    private volunteerActionSheetService: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService,
    private userProfileService: UserProfileService,
    private dismissedShareAppCardService: DismissedShareAppCardService,
    private calendarService: CalendarService,
    private contentPlanService: ContentPlanService
  ) {}

  ionViewDidEnter() {
    this.homeToolsCarousel?.refresh();
  }

  ngOnInit() {
    this.showShareAppCard = !this.dismissedShareAppCardService.isDismissed();
    this.loadCards();
    this.loadHomeMicrolearningThemes();
    this.loadCtas();
    this.refreshWelcomeTitle();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();

    (window as any).clearOnboarding = () => {
      this.onboardingService.clearOnboarding();
    };
  }

  private refreshWelcomeTitle(): void {
    const firstName =
      this.userProfileService.getProfile().firstName?.trim() ||
      this.onboardingService.getUserFirstName()?.trim();
    this.welcomeTitle = firstName ? `Welcome, ${firstName}!` : 'Welcome to Love INC';
  }

  async onRefresh(event: Event): Promise<void> {
    const refresher = (event as CustomEvent).target as HTMLIonRefresherElement;
    try {
      this.refreshWelcomeTitle();
      this.homeToolsCarousel?.refresh();
      this.verseHomeWidget?.refresh();
      this.microlearningThemeWidgets?.forEach((widget) => widget.refresh());

      await Promise.all([
        firstValueFrom(this.fetchHomeCards$()).then((cards) => {
          this.cards = cards;
        }),
        firstValueFrom(this.platformApi.getCtas()).then((ctas) => this.applyLoadedCtas(ctas)),
        firstValueFrom(this.fetchHomeMicrolearningThemes$(true)).then((themes) => {
          this.homeMicrolearningThemes = themes;
        }),
      ]);
    } catch {
      // ignore
    } finally {
      refresher?.complete?.();
    }
  }

  private fetchHomeCards$(): Observable<HomeCard[]> {
    return forkJoin({
      homeFeed: this.platformApi.getHomeFeed(),
      events: this.platformApi.getEvents(),
      classes: this.platformApi.getClasses(),
      impactStories: this.platformApi.getImpactStories(),
    }).pipe(
      map(({ homeFeed, events, classes, impactStories }) => {
        const todayMs = startOfDay(new Date()).getTime();
        const eventMap = new Map<string, PlatformEvent>((events ?? []).map((e) => [e.id, e]));
        const classMap = new Map<string, PlatformClass>((classes ?? []).map((c) => [c.id, c]));

        const eventClassCards = (homeFeed ?? [])
          .filter(
            (item): item is PlatformHomeFeedItem & { type: 'event' | 'class' } =>
              item.type === 'event' || item.type === 'class'
          )
          .filter((item) => this.isActiveEventOrClassOnHome(item, todayMs, eventMap, classMap))
          .map((item) => this.mapFeedItemToHomeCard(item, eventMap, classMap))
          .sort((a, b) => a.priority - b.priority);

        if (eventClassCards.length > 0) {
          return eventClassCards;
        }

        return (impactStories ?? [])
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, HOME_MAX_IMPACT_STORIES)
          .map((story, index) => this.mapImpactStoryToHomeCard(story, index));
      })
    );
  }

  private fetchHomeMicrolearningThemes$(refresh = false): Observable<ContentPlanTheme[]> {
    return this.contentPlanService.getThemesForHome(refresh);
  }

  private loadHomeMicrolearningThemes(refresh = false): void {
    this.fetchHomeMicrolearningThemes$(refresh).subscribe({
      next: (themes) => {
        this.homeMicrolearningThemes = themes;
      },
      error: (err) => {
        console.error('Error loading home microlearning themes:', err);
        this.homeMicrolearningThemes = [];
      },
    });
  }

  loadCtas() {
    this.platformApi.getCtas().subscribe({
      next: (ctas) => this.applyLoadedCtas(ctas),
      error: (err) => {
        console.error('Error loading CTAs:', err);
      },
    });
  }

  onPeekPlanSlideClick(event: PeekCarouselSlideClick): void {
    if (event.variant !== 'cover' && event.variant !== 'media') {
      return;
    }
    void navigateAppForward(this.navController, this.router, ['/tabs/content-plan', event.item.id], {
      queryParams: { from: 'home' },
    });
  }

  onPlatformCtaSlideClick(event: PeekCarouselSlideClick): void {
    if (event.variant !== 'media') {
      return;
    }
    const rowId = event.item.id;
    const ctaRow = this.platformCtaRows.find((item) => item.id === rowId);
    if (!ctaRow) {
      return;
    }
    void executeHomeCtaAction(
      ctaRow.action,
      this.navController,
      this.router,
      this.donateActionSheetService
    );
  }

  private applyLoadedCtas(ctas: PlatformCta[]): void {
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
    this.refreshPlatformCtaSlides();
  }

  private refreshPlatformCtaSlides(): void {
    const rows: HomeCtaRowModel[] = [];
    for (const cta of this.volunteerCtas) {
      rows.push(mapPlatformCtaToRow(cta, 'volunteer'));
    }
    for (const cta of this.giveCtas) {
      rows.push(mapPlatformCtaToRow(cta, 'give'));
    }
    this.platformCtaMediaItems = mapHomeCtaRowsToMediaItems(rows);
  }

  private isGiveCtaType(type: string): boolean {
    return type === 'donation_drive' || type === 'fundraiser' || type === 'awareness';
  }

  private isActiveCta(cta: PlatformCta, todayMs: number): boolean {
    if (cta.startDate && new Date(cta.startDate).getTime() > todayMs) return false;
    if (cta.endDate && new Date(cta.endDate).getTime() < todayMs) return false;
    return true;
  }

  /**
   * HOME STATIC CTAs (Start / Serve / Donate) — fixed list card at top of Home.
   * DO NOT CHANGE layout, order, or styling without explicit product instruction.
   * Platform/DB CTAs are separate (`platformCtaRows` + peek carousel below this block).
   * See `.cursor/rules/home-static-ctas.mdc`.
   */
  get homeStaticCtaRows(): HomeCtaRowModel[] {
    return [
      buildConnectionCenterCtaRow(),
      buildVolunteerCtaRow(),
      buildGiveNowCtaRow(this.organizationContext.publicName),
    ];
  }

  /** Platform/DB CTAs only — rendered below the static block in a peek carousel. */
  get platformCtaRows(): HomeCtaRowModel[] {
    const rows: HomeCtaRowModel[] = [];
    for (const cta of this.volunteerCtas) {
      rows.push(mapPlatformCtaToRow(cta, 'volunteer'));
    }
    for (const cta of this.giveCtas) {
      rows.push(mapPlatformCtaToRow(cta, 'give'));
    }
    return rows;
  }

  onShareAppCardDismiss(): void {
    this.dismissedShareAppCardService.dismiss();
    this.showShareAppCard = false;
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  loadCards() {
    this.fetchHomeCards$().subscribe({
      next: (cards) => {
        this.cards = cards;
      },
      error: (err) => {
        console.error('Error loading home feed:', err);
      },
    });
  }

  /**
   * Curated events/classes with endDate before today never appear on Home.
   * Resolves dates from full event/class records (nextSession, offerings, etc.).
   */
  private isActiveEventOrClassOnHome(
    item: PlatformHomeFeedItem & { type: 'event' | 'class' },
    todayMs: number,
    eventMap: Map<string, PlatformEvent>,
    classMap: Map<string, PlatformClass>
  ): boolean {
    const range = this.cardFormatting.getCalendarDateRangeForHome(
      item,
      item.type === 'event' ? eventMap.get(item.id) : undefined,
      item.type === 'class' ? classMap.get(item.id) : undefined
    );
    if (!range) return false;

    if (range.endDate) {
      const endMs = new Date(range.endDate).getTime();
      if (Number.isFinite(endMs)) return endMs >= todayMs;
    }
    if (range.startDate) {
      const startMs = new Date(range.startDate).getTime();
      if (Number.isFinite(startMs)) return startMs >= todayMs;
    }
    return false;
  }

  private mapImpactStoryToHomeCard(story: PlatformImpactStory, priority: number): HomeCard {
    const formatted = this.cardFormatting.formatForCard(story, 'impact');
    return {
      id: formatted.id,
      type: 'impact',
      photoUrl: formatted.photoUrl,
      title: formatted.title,
      subtitle: formatted.subtitle,
      shortDescription: formatted.description,
      link: `/tabs/content-detail/impact-story/${formatted.id}`,
      priority,
      badge: formatted.badge,
    };
  }

  private mapFeedItemToHomeCard(
    item: PlatformHomeFeedItem & { type: CardType },
    eventMap: Map<string, PlatformEvent>,
    classMap: Map<string, PlatformClass>
  ): HomeCard {
    const formatted = this.cardFormatting.formatForCard(item, item.type);
    let positions: Array<{ id: string; title?: string; shortDescription?: string; longDescription?: string; description?: string; schedule?: string }> = [];
    let address: string | null = null;

    if (item.type === 'event') {
      const event = eventMap.get(item.id);
      if (event) {
        const raw = (event.volunteerPositions ?? (event as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
        positions = raw.map((p) => {
          const id = p['id'] as string;
          const title = (p['title'] ?? p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
          const shortDescription = (p['shortDescription'] ?? p['short_description'] ?? p['shortDescription']) as string | undefined;
          const longDescription = (p['longDescription'] ?? p['long_description']) as string | undefined;
          return { id, title, shortDescription, longDescription, description: longDescription, schedule: this.scheduleFormatting.getPositionSchedule(p) };
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
          const longDescription = (p['longDescription'] ?? p['long_description']) as string | undefined;
          return { id, title, shortDescription, longDescription, description: longDescription, schedule: this.scheduleFormatting.getPositionSchedule(p) };
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
        const longDescription = (p['longDescription'] ?? p['long_description'] ?? p['description']) as string | undefined;
        return { id, title, shortDescription, longDescription, description: longDescription, schedule: this.scheduleFormatting.getPositionSchedule(p) };
      });
      address = item.address ? this.formatAddress(item.address) : null;
    }

    const calendarRange = this.cardFormatting.getCalendarDateRangeForHome(
      item,
      item.type === 'event' ? eventMap.get(item.id) : undefined,
      item.type === 'class' ? classMap.get(item.id) : undefined
    );

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
      startDate: calendarRange?.startDate,
      endDate: calendarRange?.endDate,
    };
  }

  private formatAddress(addr: { address?: string; city?: string; state?: string; zip?: string }): string {
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ') || '';
  }

  getActionIcons(card: HomeCard): CardActionIcon[] {
    const showVolunteer = !!card.volunteerPositions?.length;
    const canAddToCalendar =
      (card.type === 'event' || card.type === 'class') && !!card.startDate && !!card.endDate;
    return [
      {
        label: 'Volunteer',
        lucideIcon: 'heart-handshake',
        handler: () => this.onVolunteerClick(card),
        show: showVolunteer,
        buttonClass: 'volunteer-button',
      },
      {
        label: 'Calendar',
        icon: 'calendar-outline',
        handler: () => this.onCalendarClick(card),
        show: canAddToCalendar,
        buttonClass: 'calendar-button',
      },
    ];
  }

  async onCalendarClick(card: HomeCard) {
    if (!card.startDate || !card.endDate) return;
    await this.calendarService.addToCalendar({
      title: card.title,
      description: card.shortDescription,
      location: card.address ?? undefined,
      startDate: card.startDate,
      endDate: card.endDate,
    });
  }

  async onVolunteerClick(card: HomeCard) {
    if (!card.volunteerPositions?.length) return;
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: card.title,
      address: card.address ?? null,
      positions: card.volunteerPositions,
      scheduleFallback: card.subtitle ?? undefined,
      fromGapMinistry: card.type === 'gap-ministry',
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
    void navigateAppForward(this.navController, this.router, ['/tabs/content-detail', detailType, card.id], {
      queryParams: { from: 'home' },
    });
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
    this.router.navigate(['/onboarding/welcome']);
  }
}
