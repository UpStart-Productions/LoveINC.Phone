import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
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
  /** Donation drive title from the platform API (`title`). */
  donationTitle: string;
  serviceTitle: string;
  providerName: string;
  locationName: string | null;
  streetAddress: string | null;
  address: string | null;
  /** From platform when provided; avoids geocoding. */
  latitude?: number;
  longitude?: number;
  phone: string | null;
  email?: string | null;
  hours: string | null;
  acceptedItems: string[];
  /** Assistance also accepted (from platform assembly when configured). */
  assistanceItems: string[];
  shortDescription: string | null;
  notes: string | null;
  contact?: string | null;
  photoUrl?: string | null;
  volunteerPositions?: VolunteerPosition[];
}

@Component({
  selector: 'app-donate-goods',
  templateUrl: 'donate-goods.page.html',
  styleUrls: ['donate-goods.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
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

  get searchPlaceholder(): string {
    const count = this.locations.length;
    if (!count) return 'Search donation options';
    return count === 1 ? 'Search 1 donation option' : `Search ${count} donation options`;
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
    this.performSearch(this.searchQuery);
  }

  loadLocations() {
    const donationId = this.route.snapshot.queryParamMap.get('donationId');
    this.donationIdFilter = donationId?.trim() || null;
    this.platformApi.getDonations().subscribe({
      next: (data) => {
        this.locations = data.map((d) => this.mapPlatformDonationToLocation(d));
        this.performSearch(this.searchQuery);
      },
      error: (err) => {
        console.error('Error loading donation locations:', err);
      }
    });
  }

  private mapPlatformDonationToLocation(d: PlatformDonation): DonationLocation {
    const acceptedItems = this.extractDonationItemLabels(d);
    const assistanceItems = this.normalizeItemLabels(
      d.assistanceItemLabels ??
        d.assistanceItems?.map((i) => (typeof i === 'string' ? i : i?.label)),
    );
    const category = acceptedItems[0] ?? d.title ?? 'Donations';
    const photoUrl = d.photoUrl
      ? this.platformApi.resolveUploadUrl(d.photoUrl) || d.photoUrl
      : null;
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
    const providerName = d.provider?.name?.trim() ?? '';
    const locationName = d.address?.locationName?.trim() || null;
    const streetAddress = this.formatStreetAddress(d.address);
    return {
      id: d.id,
      category,
      donationTitle: d.title?.trim() || '',
      serviceTitle: d.serviceTitle?.trim() || d.title?.trim() || 'Donation',
      providerName,
      locationName,
      streetAddress,
      address: this.formatAddress(d.address),
      ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      phone: d.provider?.phone ?? null,
      email: d.provider?.email ?? null,
      hours: this.scheduleFormatting.formatScheduleRule(this.scheduleFormatting.normalizeScheduleRule(d.scheduleRule)) ?? null,
      acceptedItems,
      assistanceItems,
      shortDescription: d.shortDescription?.trim() || null,
      notes: d.longDescription?.trim() || null,
      contact: null,
      photoUrl,
      volunteerPositions: volunteerPositions.length > 0 ? volunteerPositions : undefined,
    };
  }

  private normalizeItemLabels(labels: unknown): string[] {
    if (!Array.isArray(labels)) return [];
    return labels
      .map((label) => (label == null ? '' : String(label).trim()))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  /** Item labels from API `itemLabels` or nested `items[].label`. */
  private extractDonationItemLabels(d: PlatformDonation): string[] {
    const raw = d as PlatformDonation & { item_labels?: string[] };
    const fromLabels = this.normalizeItemLabels(d.itemLabels ?? raw.item_labels);
    if (fromLabels.length) return fromLabels;
    return this.normalizeItemLabels(
      d.items?.map((item) => {
        const row = item as { label?: string; name?: string };
        return row.label ?? row.name;
      }),
    );
  }

  /** Street + city/state/zip for card display (excludes locationName). */
  private formatStreetAddress(addr: PlatformAddress | undefined): string | null {
    if (!addr) return null;
    const line = (v: string | undefined | null) =>
      v != null && String(v).trim() !== '' ? String(v).trim() : null;
    const parts = [line(addr.address), line(addr.city), line(addr.state), line(addr.zip)].filter(
      (p): p is string => !!p,
    );
    return parts.length ? parts.join(', ') : null;
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
    const customEvent = event as CustomEvent<{ value?: string }>;
    const value =
      customEvent?.detail?.value ??
      (event?.target as HTMLIonSearchbarElement | undefined)?.value ??
      this.searchQuery;
    this.searchQuery = String(value ?? '');
    this.performSearch(this.searchQuery);
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
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      this.applyDonationFilter();
    } else {
      this.filteredLocations = this.locations.filter((location) =>
        this.locationMatchesSearch(location, normalized),
      );
    }

    this.groupLocationsByCategory();
  }

  private locationMatchesSearch(location: DonationLocation, query: string): boolean {
    const fields = [
      location.donationTitle,
      location.serviceTitle,
      ...location.acceptedItems,
    ]
      .filter(Boolean)
      .map((field) => String(field).toLowerCase());

    return fields.some((field) => field.includes(query));
  }


  /** Quill HTML from the API, or plain text with line breaks converted for rich-html. */
  private descriptionToHtml(text: string | null | undefined): string {
    const raw = text?.trim();
    if (!raw) return '';
    if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<p class="app-body-secondary m-b-0">${esc(raw).replace(/\n/g, '<br>')}</p>`;
  }

  getLocationContentHtml(location: DonationLocation): string {
    const esc = (s: string | null | undefined) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const parts: string[] = [];
    parts.push(`<div class="donation-details">`);
    if (location.providerName || location.locationName || location.streetAddress || location.hours) {
      parts.push(`<div class="donation-provider-location p-b-12">`);
      if (location.providerName) {
        parts.push(`<div class="donation-detail-row"><span>${esc(location.providerName)}</span></div>`);
      }
      if (location.locationName && location.locationName !== location.providerName) {
        parts.push(`<div class="donation-detail-row"><span>${esc(location.locationName)}</span></div>`);
      }
      if (location.streetAddress) {
        parts.push(
          `<div class="donation-detail-row map-address-tappable"><ion-icon name="location-outline"></ion-icon><span>${esc(location.streetAddress)}</span></div>`,
        );
      }
      if (location.hours) {
        parts.push(
          `<div class="donation-detail-row"><ion-icon name="time-outline"></ion-icon><span>${esc(location.hours)}</span></div>`,
        );
      }
      parts.push(`</div>`);
    }
    if (location.shortDescription) {
      parts.push(`<div class="rich-html">${this.descriptionToHtml(location.shortDescription)}</div>`);
    }
    if (location.contact) parts.push(`<div class="donation-detail-row"><span>${esc(location.contact)}</span></div>`);
    if (location.notes) {
      parts.push(`<div class="rich-html notes-value m-t-8">${this.descriptionToHtml(location.notes)}</div>`);
    }
    if (location.acceptedItems?.length) {
      parts.push(`<div class="m-t-12"><div class="accepted-items">${
        location.acceptedItems.map((item) => `<span class="item-pill">${esc(item)}</span>`).join('')
      }</div></div>`);
    }
    if (location.assistanceItems?.length) {
      parts.push(
        `<div class="m-t-8"><p>Also accepts assistance:</p><div class="accepted-items">${location.assistanceItems
          .map((item) => `<span class="item-pill">${esc(item)}</span>`)
          .join('')}</div></div>`,
      );
    }
    parts.push('</div>');
    return parts.join('');
  }

  getActionIcons(location: DonationLocation): CardActionIcon[] {
    return [
      {
        icon: 'location-outline',
        label: 'Map',
        handler: () => this.onMapPinClick(location),
        show:
          !!location.address?.trim() ||
          (location.latitude != null &&
            location.longitude != null &&
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude)),
        buttonClass: 'map-button',
      },
      {
        icon: 'call-outline',
        label: 'Call',
        handler: () => this.onPhoneClick(location),
        show: !!location.phone,
        buttonClass: 'phone-button',
      },
      {
        icon: 'mail-outline',
        label: 'Email',
        handler: () => this.onEmailClick(location),
        show: !!location.email,
        buttonClass: 'email-button',
      },
      {
        lucideIcon: 'heart-handshake',
        label: 'Volunteer',
        handler: () => this.onVolunteerClick(location),
        show: !!location.volunteerPositions?.length,
        buttonClass: 'volunteer-button',
      },
    ];
  }

  onDonationCardContentAreaClick(ev: Event, location: DonationLocation): void {
    const t = (ev.target as HTMLElement).closest('.map-address-tappable');
    if (!t || !(location.streetAddress?.trim() || location.address?.trim())) return;
    ev.stopPropagation();
    void this.openDonationLocationMap(location);
  }

  private async openDonationLocationMap(location: DonationLocation): Promise<void> {
    const hasAddr = !!(location.streetAddress?.trim() || location.address?.trim());
    const hasCoords =
      location.latitude != null &&
      location.longitude != null &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude);
    if (!hasAddr && !hasCoords) return;
    await this.locationMapModal.present({
      title: location.locationName || location.providerName || location.serviceTitle,
      address: location.streetAddress ?? location.address ?? '',
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
      organizationName: location.providerName || location.serviceTitle,
      address: location.streetAddress ?? location.address,
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
    const providerLocationName = location.locationName || location.providerName;
    const htmlContent = `
      <h2>${location.serviceTitle}</h2>
      ${providerLocationName ? `<p><strong>Location:</strong> ${providerLocationName}</p>` : ''}
      ${location.streetAddress ? `<p><strong>Address:</strong> ${location.streetAddress}</p>` : ''}
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
      title: location.serviceTitle,
      subject: `Love INC Donation: ${location.serviceTitle}`,
      htmlContent: htmlContent
    });
  }
}
