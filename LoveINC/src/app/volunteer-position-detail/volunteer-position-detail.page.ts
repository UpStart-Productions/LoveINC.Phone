import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from '@ionic/angular/standalone';
import { PlatformApiService } from '../services/platform';
import type { PlatformVolunteerPositionWithAffiliate } from '../services/platform/types';
import { VolunteerActionSheetService } from '../services/volunteer-action-sheet.service';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';

@Component({
  selector: 'app-volunteer-position-detail',
  templateUrl: './volunteer-position-detail.page.html',
  styleUrls: ['./volunteer-position-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
  ],
})
export class VolunteerPositionDetailPage implements OnInit {
  position: PlatformVolunteerPositionWithAffiliate | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private platformApi: PlatformApiService,
    private volunteerActionSheet: VolunteerActionSheetService,
    private scheduleFormatting: ScheduleFormattingService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Position not found';
      this.loading = false;
      return;
    }
    this.loadPosition(id);
  }

  loadPosition(id: string) {
    this.loading = true;
    this.error = null;
    this.platformApi.getVolunteerPositions().subscribe({
      next: (items) => {
        const found = items?.find((p) => p.id === id) ?? null;
        this.position = found;
        if (!found) {
          this.error = 'Position not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading volunteer position:', err);
        this.error = 'Failed to load position';
        this.loading = false;
      },
    });
  }

  get photoUrl(): string {
    if (!this.position) return '';
    const url = (this.position['photoUrl'] ?? this.position['photo_url']) as string | undefined;
    return this.platformApi.resolveUploadUrl(url) || (url ?? '') || '';
  }

  get description(): string {
    if (!this.position) return '';
    return (this.position['description'] ?? this.position['shortDescription'] ?? '') as string;
  }

  get schedule(): string | undefined {
    if (!this.position) return undefined;
    const rule = this.position['scheduleRule'] ?? this.position['schedule_rule'];
    if (!rule || typeof rule !== 'object') return undefined;
    return this.scheduleFormatting.formatScheduleRule(this.scheduleFormatting.normalizeScheduleRule(rule)) ?? undefined;
  }

  get location(): string {
    if (!this.position?.address) return '';
    const addr = this.position.address;
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ');
  }

  get backRoute(): string {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'volunteer-positions') return '/tabs/volunteer-positions';
    if (from === 'home') return '/tabs/home';
    return '/tabs/more';
  }

  async onVolunteerClick() {
    if (!this.position) return;
    await this.volunteerActionSheet.openVolunteerActionSheet({
      organizationName: this.position.affiliate?.name ?? 'Volunteer',
      address: this.location || undefined,
      positions: [
        {
          id: this.position.id,
          title: (this.position['title'] ?? this.position['shortDescription'] ?? this.position['description']) ?? 'Volunteer',
          description: String(this.position['description'] ?? this.position['longDescription'] ?? this.position['shortDescription'] ?? '').trim() || undefined,
          schedule: this.schedule,
        },
      ],
    });
  }
}
