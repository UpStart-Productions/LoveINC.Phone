import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { TransformationClass } from './transformation-classes.page';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { AlertsModalService } from '../../services/alerts-modal.service';

@Component({
  selector: 'app-transformation-class-detail',
  templateUrl: 'transformation-class-detail.page.html',
  styleUrls: ['transformation-class-detail.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList
  ],
  providers: [AlertController]
})
export class TransformationClassDetailPage implements OnInit {
  classItem: TransformationClass | null = null;
  classId: string = '';
  fromServices: boolean = false;
  showDonateButton: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('id') || '';
    this.loadClassDetail();
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

  loadClassDetail() {
    this.http.get<TransformationClass[]>('assets/data/transformation-classes.json').subscribe({
      next: (data) => {
        this.classItem = data.find(c => c.id === this.classId) || null;
      },
      error: (err) => {
        console.error('Error loading class detail:', err);
      }
    });
  }


  async onRegisterClick() {
    if (!this.classItem) return;
    
    const alert = await this.alertController.create({
      header: 'Register',
      message: `Opening registration for ${this.classItem.title}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onAddToCalendarClick() {
    if (!this.classItem) return;
    
    const alert = await this.alertController.create({
      header: 'Add to Calendar',
      message: `Add ${this.classItem.title} to your calendar`,
      buttons: ['OK']
    });
    await alert.present();
  }

  formatSessionDates(): string {
    if (!this.classItem) return '';
    const startDate = new Date(this.classItem.nextSession.startDate);
    const endDate = new Date(this.classItem.nextSession.endDate);
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  }
}
