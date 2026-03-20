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
import type { PlatformPartner } from '../services/platform/types';

@Component({
  selector: 'app-church-partnerships',
  templateUrl: './church-partnerships.page.html',
  styleUrls: ['./church-partnerships.page.scss'],
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
export class ChurchPartnershipsPage implements OnInit {
  partners: PlatformPartner[] = [];
  loading = true;

  constructor(private platformApi: PlatformApiService) {}

  ngOnInit() {
    this.loadPartners();
  }

  loadPartners() {
    this.loading = true;
    this.platformApi.getOrganizationPartners().subscribe({
      next: (items) => {
        this.partners = items ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partners:', err);
        this.loading = false;
      },
    });
  }

  getPhotoUrl(partner: PlatformPartner): string {
    const url = partner.photoUrl ?? '';
    return this.platformApi.resolveUploadUrl(url) || url;
  }

  formatAddress(partner: PlatformPartner): string {
    const addr = partner.address;
    if (!addr) return '';
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ');
  }

}
