import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { format, addDays, startOfDay } from 'date-fns';
import { Router, RouterLink } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  NavController,
} from '@ionic/angular/standalone';
import { navigateAppForward } from '../../shared/utils/navigation-forward.util';
import { CardComponent, CardActionIcon } from '../../components/card/card.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { SharingService } from '../../services/sharing/sharing.service';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { PlatformApiService, type PlatformClass, type PlatformHomeFeedItem, type PlatformOffering } from '../../services/platform';
import { VolunteerActionSheetService } from '../../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../../services/schedule-formatting.service';
import { CardFormattingService, type FormattedCard } from '../../services/card-formatting.service';
import { CalendarService } from '../../services/calendar/calendar.service';
import { formatClassListDateRange, joinWithAppDot, apiIsoToDisplayDate } from '../../shared/utils';

export interface ClassDocument {
  title: string;
  url?: string;
  type?: 'handout' | 'worksheet' | 'resource';
}

export interface TransformationClass {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  teacher: string;
  photoUrl: string;
  registrationLink?: string;
  nextSession?: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  };
  classDocuments?: ClassDocument[];
  volunteerPositions?: Array<{ id: string; title?: string; shortDescription?: string; description?: string; schedule?: string }>;
  address?: string | null;
}

export interface ClassCardItem {
  formatted: FormattedCard;
  class: TransformationClass;
}

@Component({
  selector: 'app-transformation-classes',
  templateUrl: 'transformation-classes.page.html',
  styleUrls: ['transformation-classes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    CardComponent,
    NotificationsButtonComponent,
  ],
})
export class TransformationClassesPage implements OnInit {
  activeClassCards: ClassCardItem[] = [];
  loaded = false;
  showDonateButton: boolean = false;

  constructor(
    private platformApi: PlatformApiService,
    private cardFormatting: CardFormattingService,
    private router: Router,
    private navController: NavController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private volunteerActionSheetService: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService,
    private calendarService: CalendarService
  ) {}

  ngOnInit() {
    this.loadClasses();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  loadClasses() {
    this.platformApi.getClasses().subscribe({
      next: (data) => {
        const todayMs = startOfDay(new Date()).getTime();
        const toCard = (c: PlatformClass): ClassCardItem => {
          const cls = this.mapPlatformClassToTransformationClass(c);
          const formatted = this.cardFormatting.formatForCard(c, 'class');
          return { formatted, class: cls };
        };
        const list = data ?? [];
        this.activeClassCards = list
          .filter((c) => this.isActiveClass(c, todayMs))
          .map(toCard);
        this.loaded = true;
      },
      error: (err) => {
        console.error('Error loading transformation classes:', err);
        this.loaded = true;
      }});
  }

  get showEmptyNotice(): boolean {
    return this.activeClassCards.length === 0;
  }

  /** Class is active when its resolved end date (or start date) is today or later. */
  private isActiveClass(platformClass: PlatformClass, todayMs: number): boolean {
    const range = this.cardFormatting.getCalendarDateRangeForHome(
      { type: 'class', id: platformClass.id } as PlatformHomeFeedItem & { type: 'class' },
      undefined,
      platformClass
    );
    if (!range) {
      return false;
    }
    if (range.endDate) {
      const endMs = new Date(range.endDate).getTime();
      if (Number.isFinite(endMs)) {
        return endMs >= todayMs;
      }
    }
    if (range.startDate) {
      const startMs = new Date(range.startDate).getTime();
      if (Number.isFinite(startMs)) {
        return startMs >= todayMs;
      }
    }
    return false;
  }

  private mapPlatformClassToTransformationClass(c: PlatformClass): TransformationClass {
    let nextSession = c.nextSession ?? this.deriveNextSessionFromOfferings(c.offerings);
    if (nextSession) {
      nextSession = { ...nextSession, dayOfWeek: this.dayTo2Letter(nextSession.dayOfWeek) };
    }
    const rawPositions = (c.volunteerPositions ?? (c as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as Array<Record<string, unknown>>;
    const volunteerPositions = rawPositions.length
      ? rawPositions.map((p) => ({
          id: (p['id'] ?? p['title'] ?? c.id) as string,
          title: (p['title'] ?? p['shortDescription'] ?? p['short_description']) as string | undefined,
          shortDescription: (p['shortDescription'] ?? p['short_description']) as string | undefined,
          longDescription: (p['longDescription'] ?? p['long_description']) as string | undefined,
          description: (p['longDescription'] ?? p['long_description']) as string | undefined,
          schedule: this.scheduleFormatting.getPositionSchedule(p)}))
      : undefined;
    const address = c.address ? this.formatAddress(c.address) : null;
    return {
      id: c.id,
      title: c.title,
      shortDescription: c.shortDescription ?? '',
      description: c.longDescription ?? c.shortDescription ?? '',
      teacher: c.instructor ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(c.photoUrl) || c.photoUrl) ?? '',
      nextSession,
      volunteerPositions,
      address};
  }

  private formatAddress(addr: { address?: string; city?: string; state?: string; zip?: string }): string {
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ') || '';
  }

  private deriveSessionFromOfferings(
    offerings?: PlatformOffering[]
  ): { startDate: string; endDate: string; dayOfWeek: string; time: string } | undefined {
    if (!offerings?.length) return undefined;
    const off = offerings[0];
    const sessions = off.sessions?.filter((s: { isCancelled?: boolean }) => !s.isCancelled) ?? [];
    const session = sessions[0];
    const rule = off.scheduleRule;
    const startDate = session?.startDate ?? rule?.startDate;
    const endDate = session?.endDate ?? rule?.endDate;
    if (!startDate || !endDate) return undefined;
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = rule?.daysOfWeek?.length
      ? rule.daysOfWeek.map((n) => DAY_NAMES[n] ?? '').join(', ')
      : '';
    const time = joinWithAppDot(rule?.startTime, rule?.endTime) || '';
    return { startDate, endDate, dayOfWeek, time };
  }

  private dayTo2Letter(day: string): string {
    return day
      .split(',')
      .map((d) => d.trim().replace(/s$/, '').slice(0, 2))
      .filter(Boolean)
      .join(', ');
  }

  private deriveNextSessionFromOfferings(offerings?: PlatformOffering[]): TransformationClass['nextSession'] | undefined {
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
        ? rule.daysOfWeek.map((n) => this.dayNumberToName(n)).join(', ')
        : '';
    const time = joinWithAppDot(rule?.startTime, rule?.endTime) || '';
    return { startDate, endDate, dayOfWeek, time };
  }

  private dayNumberToName(n: number): string {
    const sun = new Date(2024, 0, 7);
    return format(addDays(sun, n), 'EEE').slice(0, 2);
  }

  navigateToClassDetail(classItem: TransformationClass) {
    void navigateAppForward(this.navController, this.router, ['/tabs/content-detail', 'class', classItem.id], {
      queryParams: { from: 'transformation-classes' },
    });
  }

  formatSessionDates(classItem: TransformationClass): string {
    if (!classItem.nextSession) return '';
    const startDate = apiIsoToDisplayDate(classItem.nextSession.startDate);
    const endDate = apiIsoToDisplayDate(classItem.nextSession.endDate);
    return formatClassListDateRange(startDate, endDate);
  }

  getActionIcons(item: ClassCardItem): CardActionIcon[] {
    const ns = item.class.nextSession;
    const canCalendar = !!(ns?.startDate && ns?.endDate);
    return [
      {
        lucideIcon: 'heart-handshake',
        handler: () => this.onVolunteerClick(item.class),
        show: !!item.class.volunteerPositions?.length,
        buttonClass: 'volunteer-button'},
      {
        icon: 'calendar-outline',
        handler: () => this.onCalendarClick(item.class),
        show: canCalendar,
        buttonClass: 'calendar-button'}];
  }

  async onCalendarClick(classItem: TransformationClass) {
    const ns = classItem.nextSession;
    if (!ns?.startDate || !ns?.endDate) return;
    await this.calendarService.addToCalendar({
      title: classItem.title,
      description: classItem.shortDescription || classItem.description,
      location: classItem.address ?? undefined,
      startDate: ns.startDate,
      endDate: ns.endDate});
  }

  async onVolunteerClick(classItem: TransformationClass) {
    if (!classItem.volunteerPositions?.length) return;
    const scheduleFallback = classItem.nextSession
      ? `${classItem.nextSession.dayOfWeek} ${classItem.nextSession.time}`
      : undefined;
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: classItem.title,
      address: classItem.address ?? null,
      positions: classItem.volunteerPositions,
      scheduleFallback});
  }

  async onShareClass(classItem: TransformationClass) {
    const sessionHtml = classItem.nextSession
      ? `<p><strong>Next Session:</strong></p><p>${classItem.nextSession.dayOfWeek} ${classItem.nextSession.time}</p><p>${this.formatSessionDates(classItem)}</p>`
      : '';
    const htmlContent = `
      <h2>${classItem.title}</h2>
      ${classItem.description ? `<p>${classItem.description}</p>` : ''}
      ${classItem.teacher ? `<p><strong>Teacher:</strong> ${classItem.teacher}</p>` : ''}
      ${sessionHtml}
    `;
    
    await this.sharingService.shareContent({
      title: classItem.title,
      subject: `Love INC Class: ${classItem.title}`,
      htmlContent: htmlContent
    });
  }
}
