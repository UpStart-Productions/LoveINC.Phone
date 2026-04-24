import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { PlatformApiService } from '../services/platform';
import type { PlatformTeamMember } from '../services/platform/types';
import { SafeHtmlPipe } from '../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.page.html',
  styleUrls: ['./staff.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    SafeHtmlPipe,
  ],
})
export class StaffPage implements OnInit {
  members: PlatformTeamMember[] = [];
  loading = true;

  constructor(private readonly platformApi: PlatformApiService) {}

  ngOnInit(): void {
    this.platformApi.getTeam().subscribe({
      next: (items) => {
        this.members = (items ?? []).sort(
          (a, b) => a.sortOrder - b.sortOrder || a.lastName.localeCompare(b.lastName)
        );
        this.loading = false;
      },
      error: () => {
        this.members = [];
        this.loading = false;
      },
    });
  }

  getPhotoUrl(m: PlatformTeamMember): string {
    return this.platformApi.resolveUploadUrl(m.photoUrl) || m.photoUrl || '';
  }

  displayName(m: PlatformTeamMember): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ').trim() || '—';
  }
}
