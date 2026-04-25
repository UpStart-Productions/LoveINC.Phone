import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { format } from 'date-fns';
import { ActivatedRoute, Router } from '@angular/router';
import {
  formatEventSubtitle,
  formatClassSessionSubtitle,
  formatDateRangeCompact,
  formatTimeStringFull,
  formatTimeRangeFull,
  dayTo2Letter,
  dayNumberTo2Letter,
  uppercaseMonth,
  APP_DOT,
  joinWithAppDot,
} from '../../shared/utils';
import { HttpClient } from '@angular/common/http';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { ContentDetail, ContentType } from './content-detail.model';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { SharingService } from '../../services/sharing/sharing.service';
import { AppUserDataService } from '../../services/app-user-data.service';
import { ServiceUnlockService } from '@upstart-productions/service-unlock';
import { UserProfileService } from '../../services/user-profile.service';
import { OnboardingService } from '../../services/onboarding.service';
import { DeviceIdService } from '../../services/device-id.service';
import { ToastController } from '@ionic/angular/standalone';
import { ActionSheetController } from '@ionic/angular/standalone';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { VolunteerActionSheetService } from '../../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../../services/schedule-formatting.service';
import { CalendarService } from '../../services/calendar/calendar.service';
import { LocationMapModalService } from '../../services/location-map-modal.service';
import { GapAccessService } from '../../services/gap-access.service';
import {
  PlatformApiService,
  type PlatformClass,
  type PlatformCta,
  type PlatformEvent,
  type PlatformImpactStory,
  type PlatformOffering,
  type PlatformPartner,
  type PlatformService,
  type PlatformVolunteerPositionWithAffiliate,
} from '../../services/platform';
import { GrovLinkDatabaseService } from '../../services/grovlink-database.service';

@Component({
  selector: 'app-content-detail',
  templateUrl: 'content-detail.page.html',
  styleUrls: ['content-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  SafeHtmlPipe,
],
  providers: [AlertController, ActionSheetController, ToastController]
})
export class ContentDetailPage implements OnInit, OnDestroy {
  contentItem: ContentDetail | null = null;
  contentType: ContentType = 'class';
  contentId: string = '';
  backRoute: string = '/tabs/home';
  pageTitle: string = 'Details';
  loading = false;
  error: string | null = null;

  /** From GrovLink local DB after a successful in-app registration for this class. */
  isRegisteredForThisClass = false;

  /**
   * Client / exploring + org requires intake + intake not done (same as Gap gating).
   * When true, class detail shows "Complete Intake to Register" instead of "Register".
   */
  classIntakeGateActive = false;

  /** Org-level: when true, user must complete intake before accessing voucher-gated services. Default true until API responds (conservative: hide voucher icons until we know). */
  intakeRequired = true;
  /** User has completed intake (from API or local unlock state). */
  intakeCompleted = false;
  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private sharingService: SharingService,
    private platformApi: PlatformApiService,
    private donateActionSheetService: DonateActionSheetService,
    private volunteerActionSheetService: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService,
    private appUserData: AppUserDataService,
    private serviceUnlock: ServiceUnlockService,
    private userProfile: UserProfileService,
    private onboarding: OnboardingService,
    private deviceId: DeviceIdService,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private calendarService: CalendarService,
    private locationMapModal: LocationMapModalService,
    private grovlinkDb: GrovLinkDatabaseService,
    private gapAccess: GapAccessService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.contentType = (this.route.snapshot.paramMap.get('type') as ContentType) || 'class';
    this.contentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.contentType === 'gap-ministry') {
      this.serviceUnlock.ensureInitialized().catch(() => {});
      this.intakeCompleted =
        this.appUserData.hasIntakeCompleted() || this.serviceUnlock.isUnlocked;
      this.subs.push(
        this.appUserData.getData$().subscribe((u) => {
          this.intakeCompleted =
            !!u?.intakeCompleted || this.serviceUnlock.isUnlocked;
        }),
        this.serviceUnlock.isUnlocked$.subscribe((u) => {
          this.intakeCompleted = this.appUserData.hasIntakeCompleted() || u;
        })
      );
      this.platformApi.getClientAccess().subscribe({
        next: (res) => {
          this.intakeRequired = res?.intakeRequired ?? false;
        },
        error: () => {},
      });
    }
    // Determine back route based on content type or query param
    const fromParam = this.route.snapshot.queryParamMap.get('from');
    if (fromParam) {
      this.backRoute = `/tabs/${fromParam}`;
    } else {
      this.backRoute = this.getDefaultBackRoute();
    }
    
    // Set page title based on content type
    this.pageTitle = this.getPageTitle();
    
    this.loadContentDetail();
  }

  async ionViewWillEnter(): Promise<void> {
    if (this.contentType === 'class' && this.contentId?.trim()) {
      await this.gapAccess.refreshState();
      this.classIntakeGateActive = this.gapAccess.isRestrictedListActive;
      await this.refreshClassRegistrationLocalStatus();
    }
  }

  private async refreshClassRegistrationLocalStatus(): Promise<void> {
    if (this.contentType !== 'class' || !this.contentId?.trim()) {
      this.isRegisteredForThisClass = false;
      return;
    }
    try {
      this.isRegisteredForThisClass = await this.grovlinkDb.isRegisteredForClass(this.contentId);
    } catch {
      this.isRegisteredForThisClass = false;
    }
  }

  private getDefaultBackRoute(): string {
    switch (this.contentType) {
      case 'event':
        return '/tabs/home';
      case 'class':
        return '/tabs/transformation-classes';
      case 'impact-story':
        return '/tabs/impact-stories';
      case 'gap-ministry':
        return '/tabs/gap-ministries';
      case 'volunteer-position':
        return '/tabs/volunteer-positions';
      case 'partner':
      case 'church-partner':
        return '/tabs/church-partnerships';
      case 'volunteer':
      case 'donation-drive':
      case 'fundraiser':
      case 'awareness':
      case 'donation-opportunity':
      default:
        return '/tabs/home';
    }
  }

  private getPageTitle(): string {
    switch (this.contentType) {
      case 'event':
        return 'Event Details';
      case 'class':
        return 'Class Details';
      case 'impact-story':
        return 'Impact Story';
      case 'gap-ministry':
        return 'Gap Ministry Details';
      case 'volunteer':
        return 'Volunteer Opportunity';
      case 'donation-drive':
        return 'Donation Drive';
      case 'fundraiser':
        return 'Fundraiser';
      case 'awareness':
        return 'Awareness';
      case 'church-partner':
      case 'partner':
        return 'Church Partner';
      case 'volunteer-position':
        return 'Volunteer Position';
      case 'donation-opportunity':
        return 'Donation Opportunity';
      default:
        return 'Details';
    }
  }

  loadContentDetail() {
    const apiTypes: ContentType[] = [
      'event',
      'class',
      'impact-story',
      'gap-ministry',
      'donation-drive',
      'volunteer',
      'fundraiser',
      'awareness',
      'volunteer-position',
      'partner',
    ];
    if (apiTypes.includes(this.contentType)) {
      this.loadFromPlatformApi();
      return;
    }

    const dataFile = this.getDataFile();
    if (!dataFile) {
      console.error('Unknown content type:', this.contentType);
      return;
    }

    this.http.get<any[]>(dataFile).subscribe({
      next: (data) => {
        const cardTypeMap: Record<string, string> = {
          'impact-story': 'impact',
          'donation-opportunity': 'donation-opportunity',
          'volunteer': 'volunteer',
          'donation-drive': 'donation-drive',
          'church-partner': 'church-partner',
          'gap-ministry': 'gap-ministry',
          'class': 'class',
          'event': 'event',
        };
        const homeCardType = cardTypeMap[this.contentType] || this.contentType;
        const filteredData = data.filter((item) => item.type === homeCardType);
        this.contentItem = filteredData.find((item) => item.id === this.contentId) || null;
        if (!this.contentItem) {
          console.error('Content item not found:', this.contentId);
        }
        if (this.contentType === 'class') {
          void this.refreshClassRegistrationLocalStatus();
        }
      },
      error: (err) => {
        console.error('Error loading content detail:', err);
      },
    });
  }

  private loadFromPlatformApi() {
    switch (this.contentType) {
      case 'class':
        this.loadClassFromApi();
        break;
      case 'event':
        this.loadEventFromApi();
        break;
      case 'impact-story':
        this.loadImpactStoryFromApi();
        break;
      case 'gap-ministry':
        this.loadServiceFromApi();
        break;
      case 'donation-drive':
      case 'volunteer':
      case 'fundraiser':
      case 'awareness':
        this.loadCtaFromApi();
        break;
      case 'volunteer-position':
        this.loadVolunteerPositionFromApi();
        break;
      case 'partner':
        this.loadPartnerFromApi();
        break;
      default:
        console.error('Unsupported API content type:', this.contentType);
    }
  }

  private loadVolunteerPositionFromApi() {
    this.loading = true;
    this.error = null;
    this.platformApi.getVolunteerPositions().subscribe({
      next: (items) => {
        const p = items?.find((pos) => pos.id === this.contentId) ?? null;
        this.contentItem = p ? this.mapPlatformVolunteerPositionToContentDetail(p) : null;
        if (!this.contentItem) {
          this.error = 'Position not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading volunteer position:', err);
        this.error = 'Failed to load position';
        this.loading = false;
      },
    });
  }

  private loadPartnerFromApi() {
    this.loading = true;
    this.error = null;
    this.platformApi.getOrganizationPartners().subscribe({
      next: (items) => {
        const p = items?.find((partner) => partner.id === this.contentId) ?? null;
        this.contentItem = p ? this.mapPlatformPartnerToContentDetail(p) : null;
        if (!this.contentItem) {
          this.error = 'Partner not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partner:', err);
        this.error = 'Failed to load partner';
        this.loading = false;
      },
    });
  }

  private mapPlatformVolunteerPositionToContentDetail(p: PlatformVolunteerPositionWithAffiliate): ContentDetail {
    const url = (p['photoUrl'] ?? p['photo_url']) as string | undefined;
    const photoUrl = this.platformApi.resolveUploadUrl(url) || (url ?? '') || '';
    const description = (p['description'] ?? p['shortDescription'] ?? '') as string;
    const rule = p['scheduleRule'] ?? p['schedule_rule'];
    const schedule = rule && typeof rule === 'object'
      ? this.scheduleFormatting.formatScheduleRule(this.scheduleFormatting.normalizeScheduleRule(rule)) ?? undefined
      : undefined;
    const location = p.address
      ? [p.address.address, p.address.city, p.address.state, p.address.zip].filter(Boolean).join(', ')
      : undefined;
    return {
      id: p.id,
      title: (p['title'] ?? p['shortDescription'] ?? 'Volunteer') as string,
      description,
      photoUrl,
      subtitle: p.affiliate?.name,
      affiliateName: p.affiliate?.name,
      location,
      volunteerSchedule: schedule,
    };
  }

  private mapPlatformPartnerToContentDetail(p: PlatformPartner): ContentDetail {
    const photoUrl = this.platformApi.resolveUploadUrl(p.photoUrl ?? '') || (p.photoUrl ?? '');
    const description = (p.longDescription ?? p.shortDescription ?? '') as string;
    const location = p.address
      ? [p.address.address, p.address.city, p.address.state, p.address.zip].filter(Boolean).join(', ')
      : undefined;
    return {
      id: p.id,
      title: p.name,
      description,
      photoUrl,
      location,
      phone: p.phone,
      email: p.email,
      website: p.website,
    };
  }

  private loadEventFromApi() {
    this.platformApi.getEvents().subscribe({
      next: (events) => {
        const e = events.find((ev) => ev.id === this.contentId);
        this.contentItem = e ? this.mapPlatformEventToContentDetail(e) : null;
        if (!this.contentItem) {
          console.error('Event not found:', this.contentId);
        }
      },
      error: (err) => {
        console.error('Error loading event detail:', err);
      },
    });
  }

  private loadImpactStoryFromApi() {
    this.platformApi.getImpactStories().subscribe({
      next: (stories) => {
        const s = stories.find((st) => st.id === this.contentId);
        this.contentItem = s ? this.mapPlatformImpactStoryToContentDetail(s) : null;
        if (!this.contentItem) {
          console.error('Impact story not found:', this.contentId);
        }
      },
      error: (err) => {
        console.error('Error loading impact story:', err);
      },
    });
  }

  private loadServiceFromApi() {
    void (async () => {
      await this.gapAccess.refreshState();
      if (this.gapAccess.isRestrictedListActive) {
        await this.router.navigateByUrl('/assistance/intro', { replaceUrl: true });
        return;
      }
      this.platformApi.getServices().subscribe({
        next: (services) => {
          const { item, service } = this.findServiceOrOfferingById(services ?? [], this.contentId);
          this.contentItem = item && service ? this.mapPlatformServiceToContentDetail(item, service) : null;
          if (!this.contentItem) {
            console.error('Gap ministry not found:', this.contentId);
          }
        },
        error: (err) => {
          console.error('Error loading gap ministry detail:', err);
        },
      });
    })();
  }

  private findServiceOrOfferingById(
    services: PlatformService[],
    id: string
  ): { item: PlatformOffering | PlatformService | null; service: PlatformService | null } {
    for (const svc of services) {
      if (svc.id === id) {
        return { item: svc, service: svc };
      }
      for (const off of svc.offerings ?? []) {
        if (off.id === id) {
          return { item: off, service: svc };
        }
      }
    }
    return { item: null, service: null };
  }

  private mapPlatformServiceToContentDetail(
    item: PlatformOffering | PlatformService,
    service: PlatformService
  ): ContentDetail {
    const isOffering = 'provider' in item;
    const off = isOffering ? (item as PlatformOffering) : null;
    const addr = off?.address;
    const location = addr
      ? [addr.address, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
      : undefined;
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let subtitle = '';
    let nextSession: ContentDetail['nextSession'] | undefined;
    if (off) {
      const rule = off.scheduleRule;
      const sessions = off.sessions?.filter((s) => !s.isCancelled) ?? [];
      const firstSession = sessions[0];
      if (firstSession) {
        const start = new Date(firstSession.startDate);
        const dayName = DAY_NAMES[start.getDay()];
        const time =
          this.formatSessionTime(firstSession.startDate) +
          (firstSession.endDate
            ? `${APP_DOT}${this.formatSessionTime(firstSession.endDate)}`
            : '');
        subtitle = joinWithAppDot(off.provider?.name, `${dayName} ${time}`);
        nextSession = {
          startDate: firstSession.startDate,
          endDate: firstSession.endDate ?? firstSession.startDate,
          dayOfWeek: dayName ?? '',
          time: time,
        };
      } else if (rule?.ruleType === 'by_appointment') {
        subtitle = off.provider?.name ?? 'By Appointment';
      } else if (rule?.daysOfWeek?.length) {
        const names = rule.daysOfWeek.map((d) => DAY_NAMES[d] ?? '').filter(Boolean);
        const schedule = names.length === 1 ? names[0] : names.length > 1 ? 'Open Weekdays' : 'By Appointment';
        const rawTime = joinWithAppDot(rule.startTime, rule.endTime) || '';
        const time = rawTime ? formatTimeStringFull(rawTime) : '';
        subtitle = joinWithAppDot(off.provider?.name, time ? `${schedule} ${time}` : schedule);
        nextSession = rule.startDate && rule.endDate
          ? {
              startDate: rule.startDate,
              endDate: rule.endDate,
              dayOfWeek: names.join(', '),
              time: time || 'See schedule',
            }
          : undefined;
      } else {
        subtitle = off.provider?.name ?? '';
      }
    } else {
      subtitle = 'By Appointment';
    }
    const title =
      off?.items?.length ? off.items.join(', ') : service.title;
    const rawPhotoUrl = off?.photoUrl ?? service.photoUrl ?? '';
    const photoUrl = this.platformApi.resolveUploadUrl(rawPhotoUrl) || rawPhotoUrl;
    const description =
      off?.longDescription ??
      off?.shortDescription ??
      service.longDescription ??
      service.shortDescription ??
      '';
    const voucherRequired = isOffering
      ? (item as PlatformOffering).voucherRequired ?? false
      : (item as PlatformService).voucherRequired ?? false;
    const vouchers = isOffering
      ? (item as PlatformOffering).vouchers?.map((v) => ({ id: v.id, title: v.title })) ?? []
      : (item as PlatformService).vouchers?.map((v) => ({ id: v.id, title: v.title })) ?? [];
    const rawPositions = (isOffering
      ? (item as PlatformOffering).volunteerPositions ?? (item as unknown as Record<string, unknown>)['volunteer_positions']
      : (item as PlatformService).volunteerPositions ?? (item as unknown as Record<string, unknown>)['volunteer_positions']) as Array<Record<string, unknown>> | undefined;
    const volunteerPositions = (rawPositions?.length ?? 0) > 0
      ? (rawPositions ?? []).map((p) => ({
          id: (p['id'] ?? p['title'] ?? (item as { id: string }).id) as string,
          title: (p['title'] ?? p['shortDescription'] ?? p['short_description']) as string | undefined,
          shortDescription: (p['shortDescription'] ?? p['short_description']) as string | undefined,
          longDescription: (p['longDescription'] ?? p['long_description']) as string | undefined,
          description: (p['longDescription'] ?? p['long_description']) as string | undefined,
          schedule: this.scheduleFormatting.getPositionSchedule(p),
        }))
      : undefined;
    return {
      id: isOffering ? (item as PlatformOffering).id : (item as PlatformService).id,
      title,
      description,
      photoUrl,
      subtitle: subtitle || undefined,
      location,
      nextSession,
      voucherRequired,
      serviceId: service.id,
      vouchers: vouchers.length ? vouchers : undefined,
      volunteerPositions,
    };
  }

  private loadCtaFromApi() {
    this.platformApi.getCtas().subscribe({
      next: (ctas) => {
        const c = ctas.find((cta) => cta.id === this.contentId);
        if (!c) {
          console.error('CTA not found:', this.contentId);
          return;
        }
        const redirect = this.getCtaRelatedRedirect(c);
        if (redirect) {
          this.router.navigate(redirect.commands, { queryParams: redirect.queryParams, replaceUrl: true });
          return;
        }
        this.contentItem = this.mapPlatformCtaToContentDetail(c);
      },
      error: (err) => {
        console.error('Error loading CTA detail:', err);
      },
    });
  }

  private getCtaRelatedRedirect(cta: PlatformCta): { commands: unknown[]; queryParams?: Record<string, string> } | null {
    if (cta.volunteerPositions?.length === 1) {
      return { commands: ['/tabs/content-detail', 'volunteer-position', cta.volunteerPositions[0].id], queryParams: { from: 'home' } };
    }
    if (cta.events?.length === 1) {
      return { commands: ['/tabs/content-detail', 'event', cta.events[0].id], queryParams: { from: 'home' } };
    }
    if (cta.class?.id) {
      return { commands: ['/tabs/content-detail', 'class', cta.class.id], queryParams: { from: 'home' } };
    }
    if (cta.impactStory?.id) {
      return { commands: ['/tabs/content-detail', 'impact-story', cta.impactStory.id], queryParams: { from: 'home' } };
    }
    if (cta.providerOffering?.id) {
      return { commands: ['/tabs/content-detail', 'gap-ministry', cta.providerOffering.id], queryParams: { from: 'home' } };
    }
    if (cta.service?.id) {
      return { commands: ['/tabs/content-detail', 'gap-ministry', cta.service.id], queryParams: { from: 'home' } };
    }
    if (cta.donation?.id) {
      return { commands: ['/tabs/donate-goods'], queryParams: { donationId: cta.donation.id, from: 'home' } };
    }
    return null;
  }

  private mapPlatformEventToContentDetail(e: PlatformEvent): ContentDetail {
    let location: string | undefined;
    if (e.address) {
      const parts = [
        e.address.locationName,
        e.address.address,
        `${e.address.city}, ${e.address.state} ${e.address.zip}`,
      ].filter(Boolean);
      location = parts.join('\n');
    }
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    const eventDate = uppercaseMonth(format(start, 'EEEE, MMMM d, yyyy'));
    const eventTime =
      start.getTime() !== end.getTime()
        ? formatTimeRangeFull(format(start, 'h:mm a'), format(end, 'h:mm a'))
        : format(start, 'h:mm a');
    const subtitle = formatEventSubtitle(e.startDate, e.endDate);
    return {
      id: e.id,
      title: e.title,
      description: e.longDescription ?? e.shortDescription ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(e.photoUrl) || e.photoUrl) ?? '',
      subtitle,
      eventDate,
      eventTime,
      startDate: e.startDate,
      endDate: e.endDate,
      location,
    };
  }

  private mapPlatformImpactStoryToContentDetail(s: PlatformImpactStory): ContentDetail {
    return {
      id: s.id,
      title: s.title,
      description: s.longDescription ?? s.shortDescription ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(s.photoUrl) || s.photoUrl) ?? '',
      // Subtitle must never be shortDescription; impact stories have no date/author from API
    };
  }

  private mapPlatformCtaToContentDetail(c: PlatformCta): ContentDetail {
    const actionLink =
      c.actionType === 'openUrl' && c.actionValue ? c.actionValue : undefined;
    const rawPositions = (c.volunteerPositions ?? (c as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
    const volunteerPositions = rawPositions.length
      ? rawPositions.map((p) => ({
          id: (p['id'] ?? p['title'] ?? c.id) as string,
          title: (p['title'] ?? p['shortDescription'] ?? p['short_description']) as string | undefined,
          shortDescription: (p['shortDescription'] ?? p['short_description']) as string | undefined,
          longDescription: (p['longDescription'] ?? p['long_description']) as string | undefined,
          description: (p['longDescription'] ?? p['long_description']) as string | undefined,
          schedule: this.scheduleFormatting.getPositionSchedule(p),
        }))
      : c.type === 'volunteer_call'
        ? [{ id: c.id, title: c.title, shortDescription: c.shortDescription, longDescription: c.longDescription, description: c.longDescription }]
        : undefined;
    const address = c.address
      ? [c.address.address, c.address.city, c.address.state, c.address.zip].filter(Boolean).join(', ')
      : undefined;
    return {
      id: c.id,
      title: c.title,
      description: c.longDescription ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(c.photoUrl) || c.photoUrl) ?? '',
      subtitle: c.shortDescription,
      actionButtonText: c.actionLabel,
      actionButtonLink: actionLink,
      volunteerPositions,
      location: address,
      donation: c.donation,
      startDate: c.startDate,
      endDate: c.endDate,
    };
  }

  private loadClassFromApi() {
    this.platformApi.getClasses().subscribe({
      next: (classes) => {
        const c = classes?.find(cls => cls.id === this.contentId);
        this.contentItem = c ? this.mapPlatformClassToContentDetail(c) : null;
        if (!this.contentItem) {
          console.error('Class not found:', this.contentId);
        }
        void this.refreshClassRegistrationLocalStatus();
      },
      error: (err) => {
        console.error('Error loading class detail:', err);
      }
    });
  }

  private mapPlatformClassToContentDetail(c: PlatformClass): ContentDetail {
    let location: string | undefined;
    if (c.address) {
      const parts = [c.address.locationName, c.address.address, c.address.city, c.address.state, c.address.zip].filter(Boolean);
      location = parts.join(', ');
    }
    let nextSession = c.nextSession ?? this.deriveNextSessionFromOfferings(c.offerings);
    if (nextSession) {
      nextSession = {
        ...nextSession,
        dayOfWeek: dayTo2Letter(nextSession.dayOfWeek),
        time: nextSession.time ? formatTimeStringFull(nextSession.time) : nextSession.time,
      };
    }
    const subtitle = nextSession ? formatClassSessionSubtitle(nextSession) : undefined;

    // Map API attachments to classDocuments for display
    const fromAttachments = (c.attachments ?? []).map((a) => ({
      title: a.label?.trim() || this.filenameFromUrl(a.url) || 'Document',
      url: this.platformApi.resolveUploadUrl(a.url) || a.url,
    }));
    const legacy = c as { classDocuments?: Array<{ title?: string; url?: string }>; documents?: Array<{ title?: string; url?: string }> };
    const fromLegacy = (legacy.classDocuments ?? legacy.documents ?? []).map((d) => ({
      title: d.title ?? 'Document',
      url: d.url ? this.platformApi.resolveUploadUrl(d.url) || d.url : undefined,
    }));
    const classDocuments = [...fromAttachments, ...fromLegacy]
      .filter((d) => d.url)
      .map((d) => ({ title: d.title, url: d.url!, type: undefined as 'handout' | 'worksheet' | 'resource' | undefined }));

    const cPhoto = c as PlatformClass & {
      instructor_photo_url?: string;
      instructor_title?: string;
      instructor_notes?: string;
    };
    const rawInstructorPhoto = c.instructorPhotoUrl ?? cPhoto.instructor_photo_url;
    const instructorPhotoUrl = rawInstructorPhoto
      ? (this.platformApi.resolveUploadUrl(rawInstructorPhoto) || rawInstructorPhoto)
      : undefined;
    const instructorTitle =
      (c.instructorTitle ?? cPhoto.instructor_title ?? '').trim() || undefined;
    const rawNotes = c.instructorNotes ?? cPhoto.instructor_notes ?? '';
    const instructorNotes =
      (typeof rawNotes === 'string' ? rawNotes : '').trim() || undefined;

    return {
      id: c.id,
      title: c.title,
      description: c.longDescription ?? c.shortDescription ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(c.photoUrl) || c.photoUrl) ?? '',
      subtitle,
      teacher: c.instructor,
      instructorTitle,
      instructorNotes,
      instructorPhotoUrl: instructorPhotoUrl || undefined,
      location,
      durationMinutes: c.durationMinutes,
      cost: c.cost,
      nextSession,
      classDocuments: classDocuments.length ? classDocuments : undefined,
    };
  }

  private filenameFromUrl(url: string): string {
    try {
      const path = new URL(url).pathname;
      const name = path.split('/').pop();
      if (name) return decodeURIComponent(name);
    } catch {
      const name = url.split('/').pop();
      if (name) return decodeURIComponent(name);
    }
    return '';
  }

  private deriveNextSessionFromOfferings(offerings?: PlatformOffering[]): ContentDetail['nextSession'] | undefined {
    if (!offerings?.length) return undefined;
    const offering = offerings[0];
    const rule = offering.scheduleRule;
    const sessions = offering.sessions?.filter((s: { isCancelled?: boolean }) => !s.isCancelled);
    const session = sessions?.[0];
    if (!rule && !session) return undefined;
    const startDate = session?.startDate ?? rule?.startDate;
    const endDate = session?.endDate ?? rule?.endDate;
    if (!startDate || !endDate) return undefined;
    const dayOfWeek =
      rule?.daysOfWeek?.length
        ? rule.daysOfWeek.map((n) => dayNumberTo2Letter(n)).join(', ')
        : '';
    const rawTime = joinWithAppDot(rule?.startTime, rule?.endTime) || '';
    const time = formatTimeStringFull(rawTime) || rawTime;
    return { startDate, endDate, dayOfWeek, time };
  }

  /** Format session date string as 12hr time. Uses UTC components when API stores local times as UTC. */
  private formatSessionTime(isoDate: string): string {
    const d = new Date(isoDate);
    const isUtc = /Z$|[\+\-]\d{2}:?\d{2}$/.test(isoDate.trim());
    const h = isUtc ? d.getUTCHours() : d.getHours();
    const m = isUtc ? d.getUTCMinutes() : d.getMinutes();
    const period = h >= 12 ? 'pm' : 'am';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const min = m.toString().padStart(2, '0');
    return `${hour12}:${min}${period}`;
  }

  private getDataFile(): string | null {
    switch (this.contentType) {
      case 'event':
        return 'assets/data/updates-events.json';
      case 'class':
        return 'assets/data/transformation-classes.json';
      case 'impact-story':
        // TODO: Add impact stories data file when available
        return 'assets/data/home-cards.json';
      case 'gap-ministry':
        return 'assets/data/gap-services.json';
      case 'volunteer':
      case 'donation-drive':
      case 'church-partner':
      case 'donation-opportunity':
        // These types use home-cards.json as their data source
        return 'assets/data/home-cards.json';
      default:
        return 'assets/data/home-cards.json';
    }
  }

  async onShareClick() {
    if (!this.contentItem) return;
    
    const htmlContent = this.buildShareContent();
    
    await this.sharingService.shareContent({
      title: this.contentItem.title,
      subject: `Love INC ${this.getContentTypeLabel()}: ${this.contentItem.title}`,
      htmlContent: htmlContent
    });
  }

  async onAddToCalendarClick() {
    if (!this.contentItem) return;

    const startDate =
      this.contentItem.nextSession?.startDate ??
      this.contentItem.startDate;
    const endDate =
      this.contentItem.nextSession?.endDate ?? this.contentItem.endDate;

    if (!startDate) {
      await this.calendarService.addToCalendar({
        title: this.contentItem.title,
        description: this.contentItem.description,
        location: this.contentItem.location,
        startDate: Date.now(),
        withPrompt: true,
      });
      return;
    }

    await this.calendarService.addToCalendar({
      title: this.contentItem.title,
      description: this.contentItem.description,
      location: this.contentItem.location,
      startDate,
      endDate,
    });
  }

  async onActionButtonClick() {
    if (!this.contentItem) return;
    
    if (this.contentItem.registrationLink) {
      // Open registration link
      window.open(this.contentItem.registrationLink, '_blank');
    } else if (this.contentItem.actionButtonLink) {
      // Open action link
      window.open(this.contentItem.actionButtonLink, '_blank');
    } else {
      // Default action
      const alert = await this.alertController.create({
        header: this.contentItem.actionButtonText || 'Action',
        message: `Action for ${this.contentItem.title}`,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  formatSessionDates(): string {
    if (!this.contentItem?.nextSession) return '';
    return formatDateRangeCompact(
      this.contentItem.nextSession.startDate,
      this.contentItem.nextSession.endDate
    );
  }

  isEvent(): boolean {
    return this.contentType === 'event';
  }

  hasInstructor(): boolean {
    if (!this.contentItem) return false;
    const item = this.contentItem;
    if (this.contentType === 'class') {
      return !!(
        item.teacher?.trim() ||
        item.instructorPhotoUrl ||
        item.instructorTitle?.trim() ||
        item.instructorNotes?.trim()
      );
    }
    return !!item.teacher?.trim();
  }

  /** Instructor display name only (not job title). */
  get instructorDisplayName(): string {
    return (this.contentItem?.teacher ?? '').trim();
  }

  /** Job / role title (smaller type in the minicard, below name). */
  get instructorTitleDisplay(): string {
    return (this.contentItem?.instructorTitle ?? '').trim();
  }

  hasInstructorNotes(): boolean {
    return !!this.contentItem?.instructorNotes?.trim();
  }

  async openInstructorNotesModal(): Promise<void> {
    if (!this.contentItem || !this.hasInstructorNotes()) return;
    const { InstructorBioModalComponent } = await import(
      '../../components/instructor-bio-modal/instructor-bio-modal.component'
    );
    const item = this.contentItem;
    const name = (item.teacher ?? '').trim() || 'Instructor';
    const modal = await this.modalController.create({
      component: InstructorBioModalComponent,
      componentProps: {
        instructorName: name,
        jobTitle: (item.instructorTitle ?? '').trim(),
        notes: (item.instructorNotes ?? '').trim(),
        photoUrl:
          this.contentType === 'class' && item.instructorPhotoUrl
            ? item.instructorPhotoUrl
            : undefined,
      },
      cssClass: 'entry-notes-modal',
      presentingElement: await this.modalController.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
      breakpoints: [0, 0.5, 1],
      initialBreakpoint: 0.55,
    });
    await modal.present();
  }

  hasSchedule(): boolean {
    return !!this.contentItem?.nextSession;
  }

  hasVolunteerSchedule(): boolean {
    return !!this.contentItem?.volunteerSchedule;
  }

  hasLocation(): boolean {
    return !!this.contentItem?.location;
  }

  async openLocationMapModal(): Promise<void> {
    const loc = this.contentItem?.location?.trim();
    if (!loc || !this.contentItem) return;
    await this.locationMapModal.present({
      title: this.contentItem.title,
      address: loc,
    });
  }

  hasPhone(): boolean {
    return !!this.contentItem?.phone;
  }

  hasEmail(): boolean {
    return !!this.contentItem?.email;
  }

  hasWebsite(): boolean {
    return !!this.contentItem?.website;
  }

  isVolunteerPosition(): boolean {
    return this.contentType === 'volunteer-position';
  }

  async onVolunteerPositionClick(): Promise<void> {
    if (!this.contentItem || this.contentType !== 'volunteer-position') return;
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: this.contentItem.affiliateName ?? this.contentItem.title,
      address: this.contentItem.location ?? undefined,
      positions: [
        {
          id: this.contentItem.id,
          title: this.contentItem.title,
          description: this.contentItem.description || undefined,
          schedule: this.contentItem.volunteerSchedule,
        },
      ],
    });
  }

  hasEventDateTime(): boolean {
    return !!(this.contentItem?.eventDate || this.contentItem?.eventTime);
  }

  hasCtaDateRange(): boolean {
    return !!(this.contentItem?.startDate && this.contentItem?.endDate);
  }

  formatCtaDateRange(): string {
    if (!this.contentItem?.startDate || !this.contentItem?.endDate) return '';
    return formatDateRangeCompact(this.contentItem.startDate, this.contentItem.endDate);
  }

  /** Date/time label to show above the title (like app-card subtitle). */
  getHeaderDateLabel(): string | null {
    if (!this.contentItem) return null;
    if (this.contentType === 'event' && this.contentItem.subtitle) {
      return this.contentItem.subtitle;
    }
    if (this.contentType === 'class' && this.contentItem.subtitle) {
      return this.contentItem.subtitle;
    }
    if (this.hasCtaDateRange()) {
      return this.formatCtaDateRange();
    }
    if (this.contentType === 'volunteer-position' && this.contentItem.volunteerSchedule) {
      return this.contentItem.volunteerSchedule;
    }
    if (this.contentType === 'gap-ministry' && this.contentItem.subtitle) {
      return this.contentItem.subtitle;
    }
    return null;
  }

  hasActionButton(): boolean {
    if (this.contentType === 'class') {
      return false;
    }
    return !!(this.contentItem?.registrationLink || this.contentItem?.actionButtonLink || this.contentItem?.actionButtonText);
  }

  /** In-app class registration (platform classes). */
  showClassRegisterButton(): boolean {
    return (
      this.contentType === 'class' &&
      !!this.contentItem &&
      !this.loading &&
      !this.error &&
      !this.isRegisteredForThisClass &&
      !this.classIntakeGateActive
    );
  }

  /** I Need Assistance for users who must complete intake before registering (same rules as Gap list). */
  showClassCompleteIntakeButton(): boolean {
    return (
      this.contentType === 'class' &&
      !!this.contentItem &&
      !this.loading &&
      !this.error &&
      !this.isRegisteredForThisClass &&
      this.classIntakeGateActive
    );
  }

  /** Class action row: Register until local DB says registered; Add to Calendar when there is a schedule. */
  showClassActionButtons(): boolean {
    if (
      this.contentType !== 'class' ||
      !this.contentItem ||
      this.loading ||
      this.error
    ) {
      return false;
    }
    if (!this.isRegisteredForThisClass) return true;
    return this.hasSchedule();
  }

  navigateToClassRegistration(): void {
    if (!this.contentItem?.id) return;
    const scheduleLabel =
      this.contentType === 'class' ? (this.getHeaderDateLabel() ?? this.contentItem.subtitle ?? '') : '';
    this.router.navigate(['/tabs/class-registration', this.contentItem.id], {
      state: {
        classTitle: this.contentItem.title,
        classPhotoUrl: this.contentItem.photoUrl?.trim() || '',
        classScheduleLabel: scheduleLabel?.trim() ?? '',
      },
    });
  }

  navigateToAssistanceIntro(): void {
    void this.router.navigateByUrl('/assistance/intro');
  }

  isDonationDrive(): boolean {
    return this.contentType === 'donation-drive';
  }

  isVolunteer(): boolean {
    return !!(this.contentItem?.volunteerPositions?.length);
  }

  /** Volunteer signup buttons hidden for Get Help clients. */
  get showVolunteerRequestActions(): boolean {
    return this.onboarding.canShowVolunteerRequestUi();
  }

  openDonateActionSheet(): void {
    if (this.isDonationDrive() && this.contentItem?.donation?.id) {
      this.router.navigate(['/tabs/donate-goods'], {
        queryParams: { donationId: this.contentItem.donation.id },
      });
    } else if (this.isDonationDrive()) {
      this.router.navigate(['/tabs/donate-goods']);
    } else {
      this.donateActionSheetService.openDonateActionSheet();
    }
  }

  async openVolunteerActionSheet(): Promise<void> {
    if (!this.contentItem?.volunteerPositions?.length) return;
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: this.contentItem.title,
      address: this.contentItem.location ?? null,
      positions: this.contentItem.volunteerPositions,
      scheduleFallback: this.contentItem.subtitle ?? undefined,
    });
  }

  hasClassDocuments(): boolean {
    return !!(this.contentItem?.classDocuments && this.contentItem.classDocuments.length > 0);
  }

  hasDuration(): boolean {
    return !!(this.contentItem?.durationMinutes && this.contentItem.durationMinutes > 0);
  }

  hasCost(): boolean {
    return !!(this.contentItem?.cost && this.contentItem.cost.trim().length > 0);
  }

  /** Show voucher icon when gap-ministry has vouchers and user has access. */
  showVoucherIcon(): boolean {
    if (this.contentType !== 'gap-ministry' || !this.contentItem?.voucherRequired) {
      return false;
    }
    return !this.intakeRequired || this.intakeCompleted;
  }

  async onVoucherClick(): Promise<void> {
    const vouchers = this.contentItem?.vouchers ?? [];
    if (vouchers.length === 0) return;
    type V = { id: string; title: string };
    let voucher: V;
    if (vouchers.length === 1) {
      voucher = vouchers[0];
    } else {
      const chosen = await new Promise<V | null>((resolve) => {
        const buttons: Array<{ text: string; role?: string; handler?: () => void }> = vouchers.map((v) => ({
          text: v.title,
          handler: () => resolve(v),
        }));
        buttons.push({ text: 'Cancel', role: 'cancel', handler: () => resolve(null) });
        this.actionSheetController
          .create({ header: 'Select voucher', buttons })
          .then((sheet) => {
            sheet.present();
            sheet.onDidDismiss().then((ev) => {
              if (ev.role === 'cancel') resolve(null);
            });
          });
      });
      if (!chosen) return;
      voucher = chosen;
    }
    const alert = await this.alertController.create({
      header: voucher.title,
      message: 'Are you sure you want to request this voucher?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Request',
          handler: async () => {
            try {
              const profile = this.userProfile.getProfile();
              const onboardingData = this.onboarding.getOnboardingData();
              await this.platformApi.postVoucherRequest({
                voucherId: voucher.id,
                email: profile.email || onboardingData?.email || undefined,
                firstName: profile.firstName || onboardingData?.firstName || undefined,
                lastName: profile.lastName || onboardingData?.lastName || undefined,
                deviceId: this.deviceId.getDeviceId(),
              });
              const toast = await this.toastController.create({
                message: 'Voucher has been requested',
                duration: 3000,
                color: 'success',
              });
              await toast.present();
            } catch (err) {
              const toast = await this.toastController.create({
                message: (err as Error)?.message ?? 'Failed to request voucher',
                duration: 3000,
                color: 'danger',
              });
              await toast.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  formatDuration(): string {
    const mins = this.contentItem?.durationMinutes ?? 0;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainder = mins % 60;
      return remainder > 0 ? `${hours} hr ${remainder} min` : `${hours} hr`;
    }
    return `${mins} min`;
  }

  getDocumentTypeIcon(type?: string): string {
    switch (type) {
      case 'handout':
        return 'document-text-outline';
      case 'worksheet':
        return 'create-outline';
      case 'resource':
        return 'library-outline';
      default:
        return 'document-outline';
    }
  }

  private buildShareContent(): string {
    if (!this.contentItem) return '';
    
    let html = `<h2>${this.contentItem.title}</h2>`;
    
    if (this.contentItem.subtitle) {
      html += `<p><strong>${this.contentItem.subtitle}</strong></p>`;
    }
    
    if (this.contentItem.description) {
      html += `<p>${this.contentItem.description}</p>`;
    }
    
    if (this.contentItem.teacher) {
      const t = (this.contentItem.instructorTitle ?? '').trim();
      const line = t
        ? `${this.contentItem.teacher}: ${t}`
        : this.contentItem.teacher;
      html += `<p><strong>Instructor:</strong> ${line}</p>`;
    } else if ((this.contentItem.instructorTitle ?? '').trim()) {
      html += `<p><strong>Instructor:</strong> ${(this.contentItem.instructorTitle ?? '').trim()}</p>`;
    }
    if (this.contentItem.instructorNotes?.trim()) {
      html += `<p>${this.contentItem.instructorNotes.trim()}</p>`;
    }
    
    if (this.contentItem.nextSession) {
      html += `<p><strong>Schedule:</strong> ${this.contentItem.nextSession.dayOfWeek} ${this.contentItem.nextSession.time}</p>`;
      html += `<p>${this.formatSessionDates()}</p>`;
    }
    
    if (this.contentItem.eventDate || this.contentItem.eventTime) {
      html += `<p><strong>Date/Time:</strong> ${this.contentItem.eventDate || ''} ${this.contentItem.eventTime || ''}</p>`;
    }
    
    if (this.contentItem.location) {
      html += `<p><strong>Location:</strong> ${this.contentItem.location}</p>`;
    }
    
    if (this.contentItem.durationMinutes) {
      html += `<p><strong>Duration:</strong> ${this.formatDuration()}</p>`;
    }
    
    if (this.contentItem.cost) {
      html += `<p><strong>Cost:</strong> ${this.contentItem.cost}</p>`;
    }
    
    return html;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  private getContentTypeLabel(): string {
    switch (this.contentType) {
      case 'event':
        return 'Event';
      case 'class':
        return 'Class';
      case 'impact-story':
        return 'Impact Story';
      case 'gap-ministry':
        return 'Gap Ministry';
      case 'volunteer':
        return 'Volunteer Opportunity';
      case 'donation-drive':
        return 'Donation Drive';
      case 'fundraiser':
        return 'Fundraiser';
      case 'awareness':
        return 'Awareness';
      case 'church-partner':
        return 'Church Partner';
      case 'donation-opportunity':
        return 'Donation Opportunity';
      default:
        return 'Content';
    }
  }
}
