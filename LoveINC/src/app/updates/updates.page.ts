import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, calendarOutline } from 'ionicons/icons';

export interface UpdateEvent {
  id: string;
  photoUrl: string;
  title: string;
  subtitle: string;
  description: string;
}

@Component({
  selector: 'app-updates',
  templateUrl: 'updates.page.html',
  styleUrls: ['updates.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
  ],
})
export class UpdatesPage implements OnInit {
  events: UpdateEvent[] = [];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    addIcons({ personCircleOutline, calendarOutline });
  }

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.http.get<UpdateEvent[]>('assets/data/updates-events.json').subscribe({
      next: (data) => {
        this.events = data;
      },
      error: (err) => {
        console.error('Error loading events:', err);
      },
    });
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }
}
