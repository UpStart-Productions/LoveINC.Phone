import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSearchbar
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { CardComponent, CardActionIcon } from '../components/card/card.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { SharingService } from '../services/sharing/sharing.service';
import { AlertsModalService } from '../services/alerts-modal.service';
import { PlatformApiService } from '../services/platform/platform-api.service';
import type { PlatformAddress, PlatformDonation, PlatformScheduleRule } from '../services/platform/types';
import type { CardBadge } from '../components/card/card.component';

/** Category → icon + color for donation badges (matches home card style) */
const DONATION_CATEGORY_STYLE: Record<string, { icon: string; color: string }> = {
  clothing: { icon: 'shirt-outline', color: '#10b981' },
  diapers: { icon: 'heart-outline', color: '#f59e0b' },
  food: { icon: 'restaurant-outline', color: '#eaa535' },
  furniture: { icon: 'cube-outline', color: '#8b7355' },
  bikes: { icon: 'bicycle-outline', color: '#349394' },
};

interface VolunteerPosition {
  id: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  schedule?: string;
}

interface DonationLocation {
  id: string;
  category: string;
  organization: string;
  address: string | null;
  phone: string | null;
  email?: string | null;
  hours: string | null;
  acceptedItems: string[];
  notes: string | null;
  contact?: string | null;
  photoUrl?: string | null;
  badge?: CardBadge;
  volunteerPositions?: VolunteerPosition[];
}

@Component({
  selector: 'app-donate-goods',
  templateUrl: 'donate-goods.page.html',
  styleUrls: ['donate-goods.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSearchbar,
    CardComponent
  ],
  providers: [AlertController]
})
export class DonateGoodsPage implements OnInit {
  locations: DonationLocation[] = [];
  filteredLocations: DonationLocation[] = [];
  groupedLocations: { [key: string]: DonationLocation[] } = {};
  categoryOrder: string[] = [];
  searchQuery: string = '';
  showDonateButton: boolean = false;

  constructor(
    private platformApi: PlatformApiService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private alertsModalService: AlertsModalService
  ) {}

  ngOnInit() {
    this.loadLocations();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  openAlertsModal() {
    this.alertsModalService.openAlertsModal();
  }

  loadLocations() {
    this.platformApi.getDonations().subscribe({
      next: (data) => {
        this.locations = data.map((d) => this.mapPlatformDonationToLocation(d));
        this.filteredLocations = this.locations;
        this.groupLocationsByCategory();
      },
      error: (err) => {
        console.error('Error loading donation locations:', err);
      }
    });
  }

  private mapPlatformDonationToLocation(d: PlatformDonation): DonationLocation {
    const acceptedItems = (d.itemLabels ?? []).slice().sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    const category = acceptedItems[0] ?? d.title ?? 'Donations';
    const photoUrl = d.photoUrl
      ? this.platformApi.resolveUploadUrl(d.photoUrl) || d.photoUrl
      : null;
    const badge = this.getDonationBadge(category, d.title);
    const volunteerPositions = (d.volunteerPositions ?? []).map((v) => {
      const raw = v as Record<string, unknown>;
      const shortDesc = (v.shortDescription ?? v.short_description ?? raw['short_description'] ?? raw['shortDescription']) as string | undefined;
      const desc = (v.description ?? raw['description']) as string | undefined;
      const sched = v.schedule ?? this.formatScheduleRule(v.scheduleRule) ?? (raw['schedule'] as string | undefined);
      return {
        id: v.id,
        title: v.title,
        shortDescription: shortDesc,
        description: desc,
        schedule: sched ?? undefined,
      };
    });
    return {
      id: d.id,
      category,
      organization: d.provider?.name ?? d.title ?? '',
      address: this.formatAddress(d.address),
      phone: d.provider?.phone ?? null,
      email: d.provider?.email ?? null,
      hours: this.formatScheduleRule(d.scheduleRule),
      acceptedItems,
      notes: d.shortDescription ?? d.longDescription ?? null,
      contact: null,
      photoUrl,
      badge,
      volunteerPositions: volunteerPositions.length > 0 ? volunteerPositions : undefined,
    };
  }

  private getDonationBadge(category: string, title: string): CardBadge {
    const label = title || category || 'Donation';
    const key = category.toLowerCase();
    const match = DONATION_CATEGORY_STYLE[key] ??
      Object.entries(DONATION_CATEGORY_STYLE).find(([k]) => key.includes(k))?.[1];
    const { icon, color } = match ?? { icon: 'gift-outline', color: '#eaa535' };
    return { icon, label, color };
  }

  private formatAddress(addr: PlatformAddress | undefined): string | null {
    if (!addr) return null;
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.length ? parts.join(', ') : addr.locationName ?? null;
  }

  private formatScheduleRule(rule: PlatformScheduleRule | undefined): string | null {
    if (!rule) return null;
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (rule.ruleType === 'by_appointment') return 'By appointment';
    if (rule.daysOfWeek?.length) {
      const names = rule.daysOfWeek.map((d) => DAY_NAMES[d] ?? '').filter(Boolean);
      const days = names.length ? names.join(', ') : '';
      const start12 = rule.startTime ? this.formatTime24To12(rule.startTime) : '';
      const end12 = rule.endTime ? this.formatTime24To12(rule.endTime) : '';
      const time = [start12, end12].filter(Boolean).join(' – ') || '';
      return [days, time].filter(Boolean).join(' ') || null;
    }
    return null;
  }

  private formatTime24To12(time24: string): string {
    const match = time24.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return time24;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = h >= 12 ? 'pm' : 'am';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h}:${m}${period}`;
  }

  groupLocationsByCategory() {
    this.groupedLocations = {};
    this.filteredLocations.forEach(location => {
      const category = location.category;
      if (!this.groupedLocations[category]) {
        this.groupedLocations[category] = [];
      }
      this.groupedLocations[category].push(location);
    });
    
    // Set category order based on first occurrence in data
    this.categoryOrder = Object.keys(this.groupedLocations);
  }

  onSearchChange(event: any) {
    // Handle ionInput events
    let value = '';
    if (event?.detail?.value !== undefined) {
      value = event.detail.value;
    } else if (event?.target?.value !== undefined) {
      value = event.target.value;
    }
    
    const query = String(value || '').toLowerCase().trim();
    this.searchQuery = query;
    this.performSearch(query);
  }

  onSearchClear() {
    this.searchQuery = '';
    this.performSearch('');
  }

  private performSearch(query: string) {
    if (!query) {
      this.filteredLocations = [...this.locations];
    } else {
      this.filteredLocations = this.locations.filter(location => {
        // Search across all fields
        const searchFields = [
          location.category,
          location.organization,
          location.address,
          location.phone,
          location.email,
          location.hours,
          location.notes,
          location.contact,
          ...(location.acceptedItems || [])
        ].filter(field => field != null).map(field => String(field).toLowerCase());

        return searchFields.some(field => field.includes(query));
      });
    }

    this.groupLocationsByCategory();
  }


  getLocationContentHtml(location: DonationLocation): string {
    const esc = (s: string | null | undefined) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const parts: string[] = [];
    parts.push(`<div class="location-header"><h2>${esc(location.organization)}</h2></div><div class="donation-details">`);
    if (location.address || location.hours) {
      parts.push(`<div class="donation-address-schedule p-t-12 p-b-12">`);
      if (location.address) parts.push(`<div class="donation-detail-row"><ion-icon name="location-outline"></ion-icon><span>${esc(location.address)}</span></div>`);
      if (location.hours) parts.push(`<div class="donation-detail-row"><ion-icon name="time-outline"></ion-icon><span>${esc(location.hours)}</span></div>`);
      parts.push(`</div>`);
    }
    if (location.phone) parts.push(`<div class="donation-detail-row"><span>${esc(location.phone)}</span></div>`);
    if (location.contact) parts.push(`<div class="donation-detail-row"><span>${esc(location.contact)}</span></div>`);
    if (location.notes) parts.push(`<div class="donation-detail-row"><span class="app-body-secondary notes-value">${esc(location.notes)}</span></div>`);
    if (location.acceptedItems?.length) {
      parts.push(`<div class="m-t-12"><div class="accepted-items">${
        location.acceptedItems.map((item) => `<span class="item-pill">${esc(item)}</span>`).join('')
      }</div></div>`);
    }
    parts.push('</div>');
    return parts.join('');
  }

  getActionIcons(location: DonationLocation): CardActionIcon[] {
    return [
      { icon: 'location-outline', handler: () => this.onMapPinClick(location), show: !!location.address, buttonClass: 'map-button' },
      { icon: 'call-outline', handler: () => this.onPhoneClick(location), show: !!location.phone, buttonClass: 'phone-button' },
      { icon: 'mail-outline', handler: () => this.onEmailClick(location), show: !!location.email, buttonClass: 'email-button' },
      { lucideIcon: 'heart-handshake', handler: () => this.onVolunteerClick(location), show: !!location.volunteerPositions?.length, buttonClass: 'volunteer-button' },
    ];
  }

  async onMapPinClick(location: DonationLocation) {
    if (!location.address) return;
    const { DonationLocationMapModalComponent } = await import(
      '../components/donation-location-map-modal/donation-location-map-modal.component'
    );
    const modal = await this.modalController.create({
      component: DonationLocationMapModalComponent,
      componentProps: {
        organization: location.organization,
        address: location.address,
        hours: location.hours ?? null,
        acceptedItems: location.acceptedItems ?? [],
      },
      cssClass: 'donation-map-modal-fullscreen',
    });
    await modal.present();
  }

  async onPhoneClick(location: DonationLocation) {
    if (location.phone) {
      const alert = await this.alertController.create({
        header: 'Phone',
        message: `Call ${location.organization} at ${location.phone}`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Call',
            handler: () => {
              window.location.href = `tel:${location.phone}`;
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async onVolunteerClick(location: DonationLocation) {
    if (!location.volunteerPositions?.length) return;
    const buttons: Array<{ text: string; icon: string; handler?: () => void; role?: string }> = location.volunteerPositions.map((pos) => {
      const subtitle = [pos.schedule ?? location.hours, pos.shortDescription ?? pos.description]
        .filter(Boolean)
        .join(' · ');
      const text = subtitle ? `${pos.title || 'Volunteer'}\n${subtitle}` : (pos.title || 'Volunteer');
      return {
        text,
        icon: 'heart-outline',
        handler: () => {
          // TODO: Navigate to volunteer flow or contact
        },
      };
    });
    buttons.push({
      text: 'Cancel',
      icon: 'close-outline',
      role: 'cancel',
    });
    const actionSheet = await this.actionSheetController.create({
      header: 'Volunteer',
      subHeader: location.organization,
      buttons,
      cssClass: 'volunteer-action-sheet services-action-sheet',
    });
    await actionSheet.present();
  }

  async onEmailClick(location: DonationLocation) {
    if (location.email) {
      const alert = await this.alertController.create({
        header: 'Email',
        message: `Email ${location.organization} at ${location.email}`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Email',
            handler: () => {
              window.location.href = `mailto:${location.email}`;
            }
          }
        ]
      });
      await alert.present();
    }
  }

  async onShareLocation(location: DonationLocation) {
    const htmlContent = `
      <h2>${location.organization}</h2>
      ${location.address ? `<p><strong>Address:</strong> ${location.address}</p>` : ''}
      ${location.hours ? `<p><strong>Hours:</strong> ${location.hours}</p>` : ''}
      ${location.phone ? `<p><strong>Phone:</strong> ${location.phone}</p>` : ''}
      ${location.email ? `<p><strong>Email:</strong> ${location.email}</p>` : ''}
      ${location.contact ? `<p><strong>Contact:</strong> ${location.contact}</p>` : ''}
      ${location.acceptedItems && location.acceptedItems.length > 0 ? `
        <p><strong>Accepted Items:</strong></p>
        <ul>
          ${location.acceptedItems.map(item => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}
      ${location.notes ? `<p>${location.notes}</p>` : ''}
    `;
    
    await this.sharingService.shareContent({
      title: location.organization,
      subject: `Love INC Donation Location: ${location.organization}`,
      htmlContent: htmlContent
    });
  }
}
