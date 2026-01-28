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
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CardComponent, CardActionIcon } from '../../components/card/card.component';
import { DonateButtonService } from '../../services/donate-button.service';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { SharingService } from '../../services/sharing/sharing.service';
import { AlertsModalService } from '../../services/alerts-modal.service';

interface GapService {
  id: string;
  service: string;
  schedule: string;
  daysTimes: string;
  church: string;
  address: string | null;
  contact: string;
  contactMethod: string;
  notes: string | null;
}

@Component({
  selector: 'app-gap-ministries',
  templateUrl: 'gap-ministries.page.html',
  styleUrls: ['gap-ministries.page.scss'],
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
    CardComponent
  ],
  providers: [AlertController]
})
export class GapMinistriesPage implements OnInit {
  services: GapService[] = [];
  groupedServices: { [key: string]: GapService[] } = {};
  scheduleOrder = ['Thursday', 'Friday', 'Saturday', 'Open Weekdays', 'By Appointment'];
  fromServices: boolean = false;
  showDonateButton: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
    this.loadServices();
    // Check if navigated from Services page
    const fromParam = this.route.snapshot.queryParamMap.get('from');
    console.log('Gap Ministries - query param "from":', fromParam);
    this.fromServices = fromParam === 'services';
    console.log('Gap Ministries - fromServices:', this.fromServices);
    
    // Also subscribe for changes
    this.route.queryParamMap.subscribe(params => {
      const from = params.get('from');
      this.fromServices = from === 'services';
      console.log('Gap Ministries - query param changed, fromServices:', this.fromServices);
    });
    
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  loadServices() {
    this.http.get<GapService[]>('assets/data/gap-services.json').subscribe({
      next: (data) => {
        this.services = data;
        this.groupServicesBySchedule();
      },
      error: (err) => {
        console.error('Error loading gap services:', err);
      }
    });
  }

  groupServicesBySchedule() {
    this.groupedServices = {};
    this.services.forEach(service => {
      const schedule = service.schedule;
      if (!this.groupedServices[schedule]) {
        this.groupedServices[schedule] = [];
      }
      this.groupedServices[schedule].push(service);
    });
  }


  getActionIcons(service: GapService): CardActionIcon[] {
    return [
      { icon: 'location-outline', handler: () => this.onMapPinClick(service), show: true, buttonClass: 'map-button' },
      { icon: 'call-outline', handler: () => this.onPhoneClick(service), show: true, buttonClass: 'phone-button' },
      { lucideIcon: 'heart-handshake', handler: () => this.onVolunteerClick(service), show: true, buttonClass: 'volunteer-button' },
      { icon: 'calendar-outline', handler: () => this.onCalendarClick(service), show: true, buttonClass: 'calendar-button' },
    ];
  }

  async onMapPinClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Map',
      message: `Show map for ${service.church}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onPhoneClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Phone',
      message: `Call ${service.church}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onVolunteerClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Volunteer Opportunities',
      message: `View volunteer opportunities for ${service.service}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onCalendarClick(service: GapService) {
    const alert = await this.alertController.create({
      header: 'Add to Calendar',
      message: `Add ${service.service} to calendar`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async onShareService(service: GapService) {
    const htmlContent = `
      <h2>${service.service}</h2>
      <p><strong>Schedule:</strong> ${service.schedule}</p>
      ${service.daysTimes ? `<p><strong>Days/Times:</strong> ${service.daysTimes}</p>` : ''}
      ${service.church ? `<p><strong>Church:</strong> ${service.church}</p>` : ''}
      ${service.address ? `<p><strong>Address:</strong> ${service.address}</p>` : ''}
      ${service.contact ? `<p><strong>Contact:</strong> ${service.contact}</p>` : ''}
      ${service.notes ? `<p>${service.notes}</p>` : ''}
    `;
    
    await this.sharingService.shareContent({
      title: service.service,
      subject: `Love INC Gap Ministry: ${service.service}`,
      htmlContent: htmlContent
    });
  }
}
