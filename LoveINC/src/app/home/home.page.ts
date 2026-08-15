import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin, combineLatest, firstValueFrom, of, type Observable } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { startOfDay } from 'date-fns';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonCard,
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
  buildGetHelpCtaRow,
  buildGiveNowCtaRow,
  mapPlatformCtaToRow,
} from '../components/home-cta-row/home-cta-row.mapper';
import type { HomeCtaRowModel } from '../components/home-cta-row/home-cta-row.model';
import { VerseOfTheDayWidgetComponent } from '../components/verse-of-the-day-widget/verse-of-the-day-widget.component';
import { TransformationToolHomeWidgetComponent } from '../components/transformation-tool-home-widget/transformation-tool-home-widget.component';
import { SimpleBudgetHomeWidgetComponent } from '../components/simple-budget-home-widget/simple-budget-home-widget.component';
import { GoalTrackerHomeWidgetComponent } from '../components/goal-tracker-home-widget/goal-tracker-home-widget.component';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { VolunteerActionSheetService } from '../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';
import { UserProfileService } from '../services/user-profile.service';
import { DeviceIdService } from '../services/device-id.service';
import { AppUserDataService } from '../services/app-user-data.service';
import { DismissedVouchersService } from '../services/dismissed-vouchers.service';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { CalendarService } from '../services/calendar/calendar.service';
import { PeekCarouselComponent, PEEK_CAROUSEL_TFT_PLANS_TAG } from '../components/peek-carousel/peek-carousel.component';
import type {
  PeekCarouselListSlide,
  PeekCarouselMediaItem,
  PeekCarouselSlideClick,
} from '../components/peek-carousel/peek-carousel.model';

const CLIENT_SUPPORT_CARD_STORAGE_KEY = 'client_support_card_displays';
const BROWSE_SERVICES_MAX_DISPLAYS = 3;
/** When Home has no active events or classes, show up to this many impact stories. */
const HOME_MAX_IMPACT_STORIES = 3;

export type ClientSupportCardState =
  | 'intake_required'
  | 'has_vouchers'
  | 'browse_services'
  | 'browse_services_hidden';

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
    IonButton,
    IonButtons,
    IonIcon,
    CardComponent,
    HomeCtaRowComponent,
    VerseOfTheDayWidgetComponent,
    TransformationToolHomeWidgetComponent,
    SimpleBudgetHomeWidgetComponent,
    GoalTrackerHomeWidgetComponent,
    NotificationsButtonComponent,
    PeekCarouselComponent,
  ],
})
export class HomePage implements OnInit {
  readonly tftPlansTag = PEEK_CAROUSEL_TFT_PLANS_TAG;

  readonly peekMediaItems: PeekCarouselMediaItem[] = [
    {
      id: 'media-1',
      title: 'Budget Basics',
      date: 'Sat, Mar 21',
      description: 'Track income and expenses with a simple weekly plan.',
      imageColor: '#214491',
    },
    {
      id: 'media-2',
      title: 'Transformation Class',
      date: 'Thu, Apr 2 · 6:00 PM',
      description: 'Small group learning with mentors and practical tools.',
      imageColor: '#349394',
    },
    {
      id: 'media-3',
      title: 'Daily Reflection',
      date: 'Today',
      description: 'A short prompt to pause and write what you are learning.',
      imageColor: '#2c5f7d',
    },
  ];

  readonly peekListSlides: PeekCarouselListSlide[] = [
    {
      id: 'list-1',
      rows: [
        {
          id: 'row-1',
          category: 'Spiritual Growth',
          lucideCategoryIcon: 'compass',
          title: 'Tools for Transformation',
          detail: 'Guided devotionals',
          lucideIcon: 'compass',
          iconBackgroundColor: '#349394',
        },
        {
          id: 'row-2',
          category: 'Money Management',
          lucideCategoryIcon: 'wallet',
          title: 'Budget Planner',
          detail: 'Weekly check-in',
          lucideIcon: 'calculator',
          iconBackgroundColor: '#214491',
          asideBadge: 'New',
        },
      ],
    },
    {
      id: 'list-2',
      rows: [
        {
          id: 'row-3',
          category: 'Life Skills',
          lucideCategoryIcon: 'trophy',
          title: 'Goal Tracker',
          detail: '3 active goals',
          lucideIcon: 'trophy',
          iconBackgroundColor: '#eaa535',
        },
        {
          id: 'row-4',
          category: 'Personal Growth',
          lucideCategoryIcon: 'sprout',
          title: 'Your Journal',
          detail: 'Last entry · Tue',
          lucideIcon: 'sprout',
          iconBackgroundColor: '#2c5f7d',
        },
        {
          id: 'row-5',
          category: 'Daily Scripture',
          lucideCategoryIcon: 'bookmark',
          title: 'Verse of the Day',
          detail: 'Psalm 23',
          lucideIcon: 'bookmark',
          iconBackgroundColor: '#3B82F6',
        },
      ],
    },
  ];

  @ViewChild(SimpleBudgetHomeWidgetComponent)
  private budgetHomeWidget?: SimpleBudgetHomeWidgetComponent;

  @ViewChild(GoalTrackerHomeWidgetComponent)
  private goalTrackerHomeWidget?: GoalTrackerHomeWidgetComponent;

  @ViewChild(VerseOfTheDayWidgetComponent)
  private verseHomeWidget?: VerseOfTheDayWidgetComponent;

  @ViewChild(TransformationToolHomeWidgetComponent)
  private transformationToolHomeWidget?: TransformationToolHomeWidgetComponent;

  cards: HomeCard[] = [];
  welcomeTitle = 'Welcome to Love INC';
  giveCtas: PlatformCta[] = [];
  volunteerCtas: PlatformCta[] = [];
  showDonateButton = false;

  /** Get Help row on Home — intake nudge, vouchers, or browse services. */
  clientSupportCardState: ClientSupportCardState | null = null;
  clientSupportVoucherCount = 0;

  private readonly cdr = inject(ChangeDetectorRef);

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
    private userProfileService: UserProfileService,
    private deviceIdService: DeviceIdService,
    private appUserDataService: AppUserDataService,
    private dismissedVouchersService: DismissedVouchersService,
    private serviceUnlock: ServiceUnlockService,
    private calendarService: CalendarService
  ) {}

  ionViewDidEnter() {
    this.budgetHomeWidget?.refresh();
    this.goalTrackerHomeWidget?.refresh();
    this.transformationToolHomeWidget?.refresh();
    void this.reloadClientContext(false);
  }

  ngOnInit() {
    this.loadCards();
    this.loadCtas();
    this.refreshWelcomeTitle();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
    void this.reloadClientContext(false);

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
      this.budgetHomeWidget?.refresh();
      this.goalTrackerHomeWidget?.refresh();
      this.verseHomeWidget?.refresh();
      this.transformationToolHomeWidget?.refresh();

      await Promise.all([
        firstValueFrom(this.fetchHomeCards$()).then((cards) => {
          this.cards = cards;
        }),
        firstValueFrom(this.platformApi.getCtas()).then((ctas) => this.applyLoadedCtas(ctas)),
        this.reloadClientContext(true),
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

  loadCtas() {
    this.platformApi.getCtas().subscribe({
      next: (ctas) => this.applyLoadedCtas(ctas),
      error: (err) => {
        console.error('Error loading CTAs:', err);
      },
    });
  }

  onPeekCoverSlideClick(event: PeekCarouselSlideClick): void {
    if (event.variant !== 'cover') {
      return;
    }
    void this.router.navigate(['/tabs/content-plan', event.item.id], {
      queryParams: { from: 'home' },
    });
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
  }

  private isGiveCtaType(type: string): boolean {
    return type === 'donation_drive' || type === 'fundraiser' || type === 'awareness';
  }

  private isActiveCta(cta: PlatformCta, todayMs: number): boolean {
    if (cta.startDate && new Date(cta.startDate).getTime() > todayMs) return false;
    if (cta.endDate && new Date(cta.endDate).getTime() < todayMs) return false;
    return true;
  }

  get showGetHelpCta(): boolean {
    return (
      this.clientSupportCardState === 'intake_required' ||
      this.clientSupportCardState === 'has_vouchers' ||
      this.clientSupportCardState === 'browse_services'
    );
  }

  get clientSupportCardDescription(): string {
    switch (this.clientSupportCardState) {
      case 'has_vouchers':
        return `You have ${this.clientSupportVoucherCount} active voucher${this.clientSupportVoucherCount === 1 ? '' : 's'}.`;
      case 'browse_services':
        return 'Browse Gap Ministries and classes.';
      default:
        return '';
    }
  }

  get clientSupportCardAction(): 'profile' | 'gap-ministries' | 'assistance-intro' {
    if (this.clientSupportCardState === 'intake_required') return 'assistance-intro';
    if (this.clientSupportCardState === 'has_vouchers') return 'profile';
    return 'gap-ministries';
  }

  get homeCtaRows(): HomeCtaRowModel[] {
    const rows: HomeCtaRowModel[] = [];

    if (this.showGetHelpCta && this.clientSupportCardState) {
      rows.push(
        buildGetHelpCtaRow(
          this.clientSupportCardDescription,
          this.clientSupportCardState === 'intake_required',
          this.clientSupportCardAction
        )
      );
    }

    for (const cta of this.volunteerCtas) {
      rows.push(mapPlatformCtaToRow(cta, 'volunteer'));
    }

    for (const cta of this.giveCtas) {
      rows.push(mapPlatformCtaToRow(cta, 'give'));
    }

    rows.push(buildGiveNowCtaRow());
    return rows;
  }

  private async reloadClientContext(fromRefresh: boolean): Promise<void> {
    await this.serviceUnlock.ensureInitialized();
    const deviceId = this.deviceIdService.getDeviceId();
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    if (!deviceId && !email) {
      if (fromRefresh) {
        return;
      }
      const count = this.getBrowseServicesDisplayCount();
      if (count >= BROWSE_SERVICES_MAX_DISPLAYS) {
        this.clientSupportCardState = 'browse_services_hidden';
      } else {
        this.clientSupportCardState = 'browse_services';
        this.incrementBrowseServicesDisplayCount();
      }
      return;
    }

    try {
      const { clientAccess, appUserProfile } = await firstValueFrom(
        combineLatest({
          clientAccess: this.platformApi.getClientAccess(),
          appUserProfile: this.platformApi.getAppUserProfile({
            deviceId: deviceId || undefined,
            email: email || undefined,
          }),
        }).pipe(take(1))
      );
      const intakeRequired = clientAccess?.intakeRequired ?? true;
      const profileIntakeCompleted = appUserProfile?.profile?.intakeCompleted ?? false;
      const apiIntakeCompleted =
        profileIntakeCompleted ||
        this.appUserDataService.hasIntakeCompleted() ||
        this.serviceUnlock.isUnlocked;

      const voucherRequests = appUserProfile?.profile?.voucherRequests ?? [];
      const dismissedIds = this.dismissedVouchersService.getDismissed();
      const validVouchers = voucherRequests.filter((vr) => {
        if (dismissedIds.has(vr.id)) return false;
        if (vr.status !== 'approved') return false;
        if (vr.deniedAt) return false;
        const expiresAt = vr.expiresAt ?? vr.createdAt;
        return new Date(expiresAt) > new Date();
      });
      this.clientSupportVoucherCount = validVouchers.length;

      if (intakeRequired && !apiIntakeCompleted) {
        this.clientSupportCardState = 'intake_required';
        return;
      }
      if (this.clientSupportVoucherCount > 0) {
        this.clientSupportCardState = 'has_vouchers';
        return;
      }

      const count = this.getBrowseServicesDisplayCount();
      if (count >= BROWSE_SERVICES_MAX_DISPLAYS) {
        this.clientSupportCardState = 'browse_services_hidden';
      } else {
        this.clientSupportCardState = 'browse_services';
        if (!fromRefresh) {
          this.incrementBrowseServicesDisplayCount();
        }
      }
    } catch {
      this.clientSupportCardState = 'browse_services';
    }
  }

  private getBrowseServicesDisplayCount(): number {
    try {
      const raw = localStorage.getItem(CLIENT_SUPPORT_CARD_STORAGE_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        return Number.isNaN(n) ? 0 : Math.max(0, n);
      }
    } catch {
      // ignore
    }
    return 0;
  }

  private incrementBrowseServicesDisplayCount(): void {
    try {
      const count = this.getBrowseServicesDisplayCount();
      localStorage.setItem(CLIENT_SUPPORT_CARD_STORAGE_KEY, String(count + 1));
    } catch {
      // ignore
    }
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
        lucideIcon: 'heart-handshake',
        handler: () => this.onVolunteerClick(card),
        show: showVolunteer,
        buttonClass: 'volunteer-button',
      },
      {
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
    this.router.navigate(['/tabs/content-detail', detailType, card.id], {
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
