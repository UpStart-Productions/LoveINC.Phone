import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { CardComponent } from '../../components/card/card.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { SharingService } from '../../services/sharing/sharing.service';
import { AlertsModalService } from '../../services/alerts-modal.service';
import { PlatformApiService, type PlatformClass, type PlatformOffering } from '../../services/platform';

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
  ],
})
export class TransformationClassesPage implements OnInit {
  classes: TransformationClass[] = [];
  fromServices: boolean = false;
  showDonateButton: boolean = false;

  constructor(
    private platformApi: PlatformApiService,
    private router: Router,
    private route: ActivatedRoute,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private alertsModalService: AlertsModalService
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

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  loadClasses() {
    this.platformApi.getClasses().subscribe({
      next: (data) => {
        this.classes = (data ?? []).map((c) => this.mapPlatformClassToTransformationClass(c));
      },
      error: (err) => {
        console.error('Error loading transformation classes:', err);
      },
    });
  }

  private mapPlatformClassToTransformationClass(c: PlatformClass): TransformationClass {
    const nextSession = c.nextSession ?? this.deriveNextSessionFromOfferings(c.offerings);
    return {
      id: c.id,
      title: c.title,
      shortDescription: c.shortDescription ?? '',
      description: c.longDescription ?? c.shortDescription ?? '',
      teacher: c.instructor ?? '',
      photoUrl: (this.platformApi.resolveUploadUrl(c.photoUrl) || c.photoUrl) ?? '',
      nextSession,
    };
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
    const dayOfWeek = rule?.daysOfWeek?.length ? this.dayNumberToName(rule.daysOfWeek[0]) : '';
    const time = [rule?.startTime, rule?.endTime].filter(Boolean).join(' – ') || '';
    return { startDate, endDate, dayOfWeek, time };
  }

  private dayNumberToName(n: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[n] ?? '';
  }

  getClassSubtitle(classItem: TransformationClass): string {
    if (classItem.nextSession) {
      const dateRange = this.formatSessionDates(classItem);
      return `${classItem.nextSession.dayOfWeek} • ${classItem.nextSession.time} • ${dateRange}`;
    }
    return classItem.teacher ? `Instructor: ${classItem.teacher}` : '';
  }

  navigateToClassDetail(classItem: TransformationClass) {
    const queryParams = this.fromServices ? { from: 'services' } : {};
    this.router.navigate(['/tabs/content-detail', 'class', classItem.id], { queryParams });
  }

  formatSessionDates(classItem: TransformationClass): string {
    if (!classItem.nextSession) return '';
    const startDate = new Date(classItem.nextSession.startDate);
    const endDate = new Date(classItem.nextSession.endDate);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
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
