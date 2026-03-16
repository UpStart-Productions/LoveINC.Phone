import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ContentCardComponent } from '../components/content-card/content-card.component';
import { PlatformApiService } from '../services/platform';
import type { PlatformVolunteerPositionWithAffiliate } from '../services/platform/types';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';

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
    IonBackButton,
    IonButtons,
    IonSpinner,
    ContentCardComponent,
  ],
})
export class VolunteerPositionsPage implements OnInit {
  positions: PlatformVolunteerPositionWithAffiliate[] = [];
  loading = true;

  constructor(
    private platformApi: PlatformApiService,
    private scheduleFormatting: ScheduleFormattingService,
  ) {}

  ngOnInit() {
    this.loadPositions();
  }

  loadPositions() {
    this.loading = true;
    this.platformApi.getVolunteerPositions().subscribe({
      next: (items) => {
        this.positions = items ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading volunteer positions:', err);
        this.loading = false;
      },
    });
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

  getDescription(position: PlatformVolunteerPositionWithAffiliate): string {
    const desc = (position['description'] ?? position['shortDescription'] ?? '') as string;
    const affiliate = position.affiliate?.name;
    const addr = this.formatAddress(position);
    const parts = [desc];
    if (affiliate) parts.push(affiliate);
    if (addr) parts.push(addr);
    return parts.filter(Boolean).join('\n\n');
  }

  /** Short detail for card (schedule or address, not full description). */
  getCardDetail(position: PlatformVolunteerPositionWithAffiliate): string | undefined {
    const schedule = this.getSchedule(position);
    const addr = this.formatAddress(position);
    const parts = [schedule, addr].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  }
}
