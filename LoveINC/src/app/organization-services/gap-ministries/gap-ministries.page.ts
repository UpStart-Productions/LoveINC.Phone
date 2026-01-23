import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CardComponent, CardActionIcon } from '../../components/card/card.component';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadServices();
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

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  getActionIcons(service: GapService): CardActionIcon[] {
    return [
      { icon: 'location-outline', handler: () => this.onMapPinClick(service), show: true, buttonClass: 'map-button' },
      { icon: 'call-outline', handler: () => this.onPhoneClick(service), show: true, buttonClass: 'phone-button' },
      { icon: 'people-outline', handler: () => this.onVolunteerClick(service), show: true, buttonClass: 'volunteer-button' },
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
}
