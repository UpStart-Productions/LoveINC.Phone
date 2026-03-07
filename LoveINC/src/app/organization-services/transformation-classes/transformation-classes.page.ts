import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { format, addDays } from 'date-fns';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { CardComponent, CardActionIcon } from '../../components/card/card.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { SharingService } from '../../services/sharing/sharing.service';
import { NotificationsButtonComponent } from '../../components/notifications-button/notifications-button.component';
import { PlatformApiService, type PlatformClass, type PlatformOffering } from '../../services/platform';
import { VolunteerActionSheetService } from '../../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../../services/schedule-formatting.service';
import { CardFormattingService, type FormattedCard } from '../../services/card-formatting.service';

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
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    CardComponent,
    NotificationsButtonComponent,
  ],
})
export class TransformationClassesPage implements OnInit {
  classCards: ClassCardItem[] = [];
  fromServices: boolean = false;
  showDonateButton: boolean = false;

  constructor(
    private platformApi: PlatformApiService,
    private cardFormatting: CardFormattingService,
    private router: Router,
    private route: ActivatedRoute,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private volunteerActionSheetService: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService
  ) {}

  ngOnInit() {
    this.loadClasses();
    // Check if navigated from Services page
    this.route.queryParamMap.subscribe(params => {
      this.fromServices = params.get('from') === 'services';
    });
    // Also check snapshot for immediate value
    this.fromServices = this.route.snapshot.queryParamMap.get('from') === 'services';
    
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  loadClasses() {
    this.platformApi.getClasses().subscribe({
      next: (data) => {
        this.classCards = (data ?? []).map((c) => {
          const cls = this.mapPlatformClassToTransformationClass(c);
          const formatted = this.cardFormatting.formatForCard(c, 'class');
          return { formatted, class: cls };
        });
      },
      error: (err) => {
        console.error('Error loading transformation classes:', err);
      },
    });
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
          schedule: this.scheduleFormatting.getPositionSchedule(p),
        }))
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
      address,
    };
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
    const time = [rule?.startTime, rule?.endTime].filter(Boolean).join(' – ') || '';
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
    const time = [rule?.startTime, rule?.endTime].filter(Boolean).join(' – ') || '';
    return { startDate, endDate, dayOfWeek, time };
  }

  private dayNumberToName(n: number): string {
    const sun = new Date(2024, 0, 7);
    return format(addDays(sun, n), 'EEE').slice(0, 2);
  }

  navigateToClassDetail(classItem: TransformationClass) {
    const queryParams = this.fromServices ? { from: 'services' } : {};
    this.router.navigate(['/tabs/content-detail', 'class', classItem.id], { queryParams });
  }

  formatSessionDates(classItem: TransformationClass): string {
    if (!classItem.nextSession) return '';
    const startDate = new Date(classItem.nextSession.startDate);
    const endDate = new Date(classItem.nextSession.endDate);
    return `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`;
  }

  getActionIcons(item: ClassCardItem): CardActionIcon[] {
    return [
      {
        lucideIcon: 'heart-handshake',
        handler: () => this.onVolunteerClick(item.class),
        show: !!item.class.volunteerPositions?.length,
        buttonClass: 'volunteer-button',
      },
    ];
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
      scheduleFallback,
    });
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
