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
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { PlatformApiService } from '../services/platform';
import type { PlatformPartner } from '../services/platform/types';

@Component({
  selector: 'app-partner-detail',
  templateUrl: './partner-detail.page.html',
  styleUrls: ['./partner-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonItem,
    IonLabel,
    IonList,
    IonIcon,
    IonSpinner,
  ],
})
export class PartnerDetailPage implements OnInit {
  partner: PlatformPartner | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private platformApi: PlatformApiService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Partner not found';
      this.loading = false;
      return;
    }
    this.loadPartner(id);
  }

  loadPartner(id: string) {
    this.loading = true;
    this.error = null;
    this.platformApi.getOrganizationPartners().subscribe({
      next: (items) => {
        const found = items?.find((p) => p.id === id) ?? null;
        this.partner = found;
        if (!found) {
          this.error = 'Partner not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partner:', err);
        this.error = 'Failed to load partner';
        this.loading = false;
      },
    });
  }

  get photoUrl(): string {
    if (!this.partner) return '';
    const url = this.partner.photoUrl ?? '';
    return this.platformApi.resolveUploadUrl(url) || url;
  }

  get description(): string {
    if (!this.partner) return '';
    return (this.partner['longDescription'] ?? this.partner['shortDescription'] ?? '') as string;
  }

  get location(): string {
    if (!this.partner?.address) return '';
    const addr = this.partner.address;
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ');
  }

  get backRoute(): string {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'church-partnerships') return '/tabs/church-partnerships';
    return '/tabs/more';
  }
}
