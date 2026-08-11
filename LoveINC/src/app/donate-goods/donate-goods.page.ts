import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { CardComponent, CardActionIcon } from '../components/card/card.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { VolunteerActionSheetService } from '../services/volunteer-action-sheet.service';
import { SharingService } from '../services/sharing/sharing.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { PlatformApiService } from '../services/platform/platform-api.service';
import type { PlatformAddress, PlatformDonation, PlatformVolunteerPosition } from '../services/platform/types';
import { ScheduleFormattingService } from '../services/schedule-formatting.service';
import { LocationMapModalService } from '../services/location-map-modal.service';
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
  /** From platform when provided; avoids geocoding. */
  latitude?: number;
  longitude?: number;
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
    CardComponent,
    NotificationsButtonComponent,
  ],
})
export class DonateGoodsPage implements OnInit {
  locations: DonationLocation[] = [];
  filteredLocations: DonationLocation[] = [];
  groupedLocations: { [key: string]: DonationLocation[] } = {};
  categoryOrder: string[] = [];
  searchQuery: string = '';
  showDonateButton: boolean = false;
  /** When set (from donation-drive context), pre-filter to this location */
  private donationIdFilter: string | null = null;

  get isFilteredByDonation(): boolean {
    return !!this.donationIdFilter;
  }

  constructor(
    private platformApi: PlatformApiService,
    private route: ActivatedRoute,
    private router: Router,
    private donateButtonService: DonateButtonService,
    private volunteerActionSheetService: VolunteerActionSheetService,
    private donateActionSheetService: DonateActionSheetService,
    private sharingService: SharingService,
    private scheduleFormatting: ScheduleFormattingService,
    private locationMapModal: LocationMapModalService
  ) {}

  ngOnInit() {
    this.loadLocations();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  clearDonationFilter() {
    this.donationIdFilter = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { donationId: null },
      queryParamsHandling: 'merge',
    });
    this.applyDonationFilter();
    this.groupLocationsByCategory();
  }

  loadLocations() {
    const donationId = this.route.snapshot.queryParamMap.get('donationId');
    this.donationIdFilter = donationId?.trim() || null;
    this.platformApi.getDonations().subscribe({
      next: (data) => {
        this.locations = data.map((d) => this.mapPlatformDonationToLocation(d));
        this.applyDonationFilter();
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
    const positions = (d.volunteerPositions ?? (d as unknown as Record<string, unknown>)['volunteer_positions'] ?? []) as PlatformVolunteerPosition[];
    const volunteerPositions = positions.map((v) => {
      const raw = v as Record<string, unknown>;
      const shortDesc = (raw['shortDescription'] ?? raw['short_description']) as string | undefined;
      const longDesc = (raw['longDescription'] ?? raw['long_description']) as string | undefined;
      return {
        id: v.id,
        title: (v.title ?? raw['title']) as string | undefined,
        shortDescription: shortDesc,
        longDescription: longDesc,
        description: longDesc,
        schedule: this.scheduleFormatting.getPositionSchedule(v) ?? undefined,
      };
    });
    const coords = this.coordinatesFromPlatformAddress(d.address);
    return {
      id: d.id,
      category,
      organization: d.provider?.name ?? d.title ?? '',
      address: this.formatAddress(d.address),
      ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      phone: d.provider?.phone ?? null,
      email: d.provider?.email ?? null,
      hours: this.scheduleFormatting.formatScheduleRule(this.scheduleFormatting.normalizeScheduleRule(d.scheduleRule)) ?? null,
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

  /**
   * Prefer street + locality; if the API only fills locationName, still produce a
   * geocodable string (e.g. venue name + city + state).
   */
  private formatAddress(addr: PlatformAddress | undefined): string | null {
    if (!addr) return null;
    const line = (v: string | undefined | null) =>
      v != null && String(v).trim() !== '' ? String(v).trim() : null;
    const fromStreet = [line(addr.address), line(addr.city), line(addr.state), line(addr.zip)].filter(
      (p): p is string => !!p
    );
    if (fromStreet.length) return fromStreet.join(', ');
    const fromName = [line(addr.locationName), line(addr.city), line(addr.state), line(addr.zip)].filter(
      (p): p is string => !!p
    );
    return fromName.length ? fromName.join(', ') : null;
  }

  private coordinatesFromPlatformAddress(
    addr: PlatformAddress | undefined
  ): { lat: number; lng: number } | null {
    if (!addr) return null;
    const ext = addr as unknown as Record<string, unknown>;
    const rawLat = addr.latitude ?? ext['lat'];
    const rawLng = addr.longitude ?? ext['lng'] ?? ext['long'];
    if (rawLat == null || rawLng == null) return null;
    const lat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
    const lng = typeof rawLng === 'number' ? rawLng : Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
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

  onSearchChange(event: CustomEvent | Event) {
    let value: string | null | undefined = '';
    const customEvent = event as CustomEvent<{ value?: string }>;
    if (customEvent?.detail?.value !== undefined) {
      value = customEvent.detail.value;
    } else {
      const target = event?.target as HTMLIonSearchbarElement | undefined;
      if (target?.value !== undefined && target?.value !== null) {
        value = target.value;
      }
    }
    const query = String(value ?? '').toLowerCase().trim();
    this.searchQuery = query;
    this.performSearch(query);
  }

  onSearchClear() {
    this.searchQuery = '';
    this.performSearch('');
  }

  private applyDonationFilter(): void {
    if (this.donationIdFilter) {
      const match = this.locations.find((loc) => loc.id === this.donationIdFilter);
      this.filteredLocations = match ? [match] : this.locations;
      if (!match) {
        console.warn('DonateGoodsPage: donationId not found, showing all locations', this.donationIdFilter);
      }
    } else {
      this.filteredLocations = [...this.locations];
    }
  }

  private performSearch(query: string) {
    if (!query) {
      this.applyDonationFilter();
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
      if (location.address) {
        parts.push(
          `<div class="donation-detail-row map-address-tappable"><ion-icon name="location-outline"></ion-icon><span>${esc(location.address)}</span></div>`
        );
      }
      if (location.hours) parts.push(`<div class="donation-detail-row"><ion-icon name="time-outline"></ion-icon><span>${esc(location.hours)}</span></div>`);
      parts.push(`</div>`);
    }
    if (location.phone) {
      const phone = location.phone.trim();
      const telHref = phone.replace(/"/g, '&quot;');
      parts.push(
        `<div class="donation-detail-row"><span><a class="app-link" href="tel:${telHref}">${esc(location.phone)}</a></span></div>`
      );
    }
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
      {
        icon: 'location-outline',
        handler: () => this.onMapPinClick(location),
        show:
          !!location.address?.trim() ||
          (location.latitude != null &&
            location.longitude != null &&
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude)),
        buttonClass: 'map-button',
      },
      { icon: 'call-outline', handler: () => this.onPhoneClick(location), show: !!location.phone, buttonClass: 'phone-button' },
      { icon: 'mail-outline', handler: () => this.onEmailClick(location), show: !!location.email, buttonClass: 'email-button' },
      {
        lucideIcon: 'heart-handshake',
        handler: () => this.onVolunteerClick(location),
        show: !!location.volunteerPositions?.length,
        buttonClass: 'volunteer-button',
      },
    ];
  }

  onDonationCardContentAreaClick(ev: Event, location: DonationLocation): void {
    const t = (ev.target as HTMLElement).closest('.map-address-tappable');
    if (!t || !location.address?.trim()) return;
    ev.stopPropagation();
    void this.openDonationLocationMap(location);
  }

  private async openDonationLocationMap(location: DonationLocation): Promise<void> {
    const hasAddr = !!location.address?.trim();
    const hasCoords =
      location.latitude != null &&
      location.longitude != null &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude);
    if (!hasAddr && !hasCoords) return;
    await this.locationMapModal.present({
      title: location.organization,
      address: location.address ?? '',
      latitude: location.latitude,
      longitude: location.longitude,
      hours: location.hours ?? null,
      acceptedItems: location.acceptedItems ?? [],
    });
  }

  async onMapPinClick(location: DonationLocation) {
    await this.openDonationLocationMap(location);
  }

  onPhoneClick(location: DonationLocation) {
    if (location.phone) {
      window.location.href = `tel:${location.phone}`;
    }
  }

  async onVolunteerClick(location: DonationLocation) {
    if (!location.volunteerPositions?.length) return;
    await this.volunteerActionSheetService.openVolunteerActionSheet({
      organizationName: location.organization,
      address: location.address,
      positions: location.volunteerPositions,
      scheduleFallback: location.hours ?? undefined,
    });
  }

  onEmailClick(location: DonationLocation) {
    if (location.email) {
      window.location.href = `mailto:${location.email}`;
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
