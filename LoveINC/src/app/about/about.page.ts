import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { PlatformApiService } from '../services/platform';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';
@Component({
  selector: 'app-about',
  templateUrl: 'about.page.html',
  styleUrls: ['about.page.scss'],
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonIcon,
    IonButton,
    IonButtons,
    NotificationsButtonComponent,
  ],
})
export class AboutPage implements OnInit {
  showDonateButton: boolean = false;
  /** Shown when GET /team returns at least one member. */
  showMeetStaffButton = false;

  constructor(
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private platformApi: PlatformApiService
  ) {}

  ngOnInit() {
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
    this.platformApi.getTeam().subscribe({
      next: (team) => {
        this.showMeetStaffButton = (team?.length ?? 0) > 0;
      },
      error: () => {
        this.showMeetStaffButton = false;
      },
    });
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }
}
