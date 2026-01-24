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
import { CardComponent } from '../components/card/card.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
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
    private donateActionSheetService: DonateActionSheetService
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

}
