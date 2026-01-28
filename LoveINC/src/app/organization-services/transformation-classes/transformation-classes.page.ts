import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { CardComponent } from '../../components/card/card.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { SharingService } from '../../services/sharing/sharing.service';
import { AlertsModalService } from '../../services/alerts-modal.service';
export interface TransformationClass {
  id: string;
  title: string;
  description: string;
  teacher: string;
  photoUrl: string;
  registrationLink: string;
  nextSession: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  };
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
    private http: HttpClient,
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
    this.http.get<TransformationClass[]>('assets/data/transformation-classes.json').subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (err) => {
        console.error('Error loading transformation classes:', err);
      }
    });
  }


  navigateToClassDetail(classItem: TransformationClass) {
    const queryParams = this.fromServices ? { from: 'services' } : {};
    this.router.navigate(['/tabs/transformation-classes', classItem.id], { queryParams });
  }

  formatSessionDates(classItem: TransformationClass): string {
    const startDate = new Date(classItem.nextSession.startDate);
    const endDate = new Date(classItem.nextSession.endDate);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startMonth} - ${endMonth}`;
  }

  async onShareClass(classItem: TransformationClass) {
    const htmlContent = `
      <h2>${classItem.title}</h2>
      ${classItem.description ? `<p>${classItem.description}</p>` : ''}
      ${classItem.teacher ? `<p><strong>Teacher:</strong> ${classItem.teacher}</p>` : ''}
      ${classItem.nextSession ? `
        <p><strong>Next Session:</strong></p>
        <p>${classItem.nextSession.dayOfWeek} ${classItem.nextSession.time}</p>
        <p>${this.formatSessionDates(classItem)}</p>
      ` : ''}
    `;
    
    await this.sharingService.shareContent({
      title: classItem.title,
      subject: `Love INC Class: ${classItem.title}`,
      htmlContent: htmlContent
    });
  }
}
