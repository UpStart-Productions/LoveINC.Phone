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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel
  ],
})
export class GapMinistriesPage implements OnInit {
  services: GapService[] = [];
  groupedServices: { [key: string]: GapService[] } = {};
  scheduleOrder = ['Thursday', 'Friday', 'Saturday', 'Open Weekdays', 'By Appointment'];

  constructor(
    private http: HttpClient,
    private router: Router
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
}
