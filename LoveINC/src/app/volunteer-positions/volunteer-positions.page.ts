import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonSpinner,
  IonButton,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardComponent } from '../components/content-card/content-card.component';
import { PlatformApiService } from '../services/platform';
import type { PlatformVolunteerPositionWithAffiliate } from '../services/platform/types';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';
import { VolunteerActionSheetService } from '../services/volunteer-action-sheet.service';
import {
  isVolunteerPositionOpen,
  joinWithAppDot,
  sortVolunteerPositionsOpenFirst,
} from '../shared/utils';

@Component({
  selector: 'app-volunteer-positions',
  templateUrl: './volunteer-positions.page.html',
  styleUrls: ['./volunteer-positions.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonSpinner,
    IonButton,
    ContentCardComponent,
    AppBackButtonComponent,
  ],
})
export class VolunteerPositionsPage implements OnInit {
  positions: PlatformVolunteerPositionWithAffiliate[] = [];
  loading = true;

  constructor(
    private platformApi: PlatformApiService,
    private scheduleFormatting: ScheduleFormattingService,
    private volunteerActionSheetService: VolunteerActionSheetService
  ) {}

  ngOnInit() {
    this.loadPositions();
  }

  get hasOpenPositions(): boolean {
    return this.positions.some((p) => isVolunteerPositionOpen(p));
  }

  isPositionOpen(position: PlatformVolunteerPositionWithAffiliate): boolean {
    return isVolunteerPositionOpen(position);
  }

  loadPositions() {
    this.loading = true;
    this.platformApi.getVolunteerPositions().subscribe({
      next: (positions) => {
        this.positions = sortVolunteerPositionsOpenFirst(positions ?? []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading volunteer positions:', err);
        this.loading = false;
      },
    });
  }

  openVolunteerSignup(): void {
    void this.volunteerActionSheetService.openGeneralVolunteerSignup();
  }

  getPhotoUrl(position: PlatformVolunteerPositionWithAffiliate): string {
    const url = (position['photoUrl'] ?? position['photo_url']) as string | undefined;
    return this.platformApi.resolveUploadUrl(url) || (url ?? '') || '';
  }

  formatAddress(position: PlatformVolunteerPositionWithAffiliate): string {
    const addr = position.address;
    if (!addr) return '';
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ');
  }

  getSchedule(position: PlatformVolunteerPositionWithAffiliate): string | undefined {
    const rule = position['scheduleRule'] ?? position['schedule_rule'];
    if (!rule || typeof rule !== 'object') return undefined;
    return this.scheduleFormatting.formatScheduleRule(this.scheduleFormatting.normalizeScheduleRule(rule)) ?? undefined;
  }

  /** Short detail for card (schedule or address, not full description). */
  getCardDetail(position: PlatformVolunteerPositionWithAffiliate): string | undefined {
    const schedule = this.getSchedule(position);
    const addr = this.formatAddress(position);
    const parts = [schedule, addr].filter(Boolean);
    return parts.length ? joinWithAppDot(...parts) : undefined;
  }
}
