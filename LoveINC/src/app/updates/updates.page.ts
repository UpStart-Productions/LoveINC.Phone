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
} from '@ionic/angular/standalone';
import { CardComponent, CardActionIcon } from '../components/card/card.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { SharingService } from '../services/sharing/sharing.service';
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
    CardComponent,
  ],
})
export class UpdatesPage implements OnInit {
  events: UpdateEvent[] = [];
  showDonateButton: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService
  ) {}

  ngOnInit() {
    this.loadEvents();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
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

  getActionIcons(event: UpdateEvent): CardActionIcon[] {
    return [
      { icon: 'calendar-outline', handler: () => this.onCalendarClick(event), show: true, buttonClass: 'calendar-button' },
    ];
  }

  onCalendarClick(event: UpdateEvent) {
    // TODO: Implement calendar functionality
    console.log('Calendar clicked for event:', event.title);
  }

  async onShareEvent(event: UpdateEvent) {
    const htmlContent = `
      <h2>${event.title}</h2>
      ${event.subtitle ? `<p><strong>${event.subtitle}</strong></p>` : ''}
      ${event.description ? `<p>${event.description}</p>` : ''}
    `;
    
    await this.sharingService.shareContent({
      title: event.title,
      subject: `Love INC Event: ${event.title}`,
      htmlContent: htmlContent
    });
  }

}
