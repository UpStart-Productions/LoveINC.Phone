import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';
import { LocationPopoverComponent } from '../components/location-popover/location-popover.component';
import { DonateButtonService } from '../services/donate-button.service';
import { DonateActionSheetService } from '../services/donate-action-sheet.service';
import { NotificationsButtonComponent } from '../components/notifications-button/notifications-button.component';
import { GoogleMapsLoaderService } from '../services/google-maps-loader.service';
import { AddressGeocodingService } from '../services/address-geocoding.service';
import { PlatformApiService } from '../services/platform';
import type { PlatformPartner } from '../services/platform/types';

declare var google: any;

/** Partner plus map position (API coordinates and/or same geocoding as Church Partnerships address tap). */
export interface ChurchMapPin {
  partner: PlatformPartner;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-church-map',
  templateUrl: 'church-map.page.html',
  styleUrls: ['church-map.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonSpinner,
    NotificationsButtonComponent,
  ],
  providers: [PopoverController],
})
export class ChurchMapPage implements OnInit, OnDestroy {
  map: any;
  markers: any[] = [];
  /** Pins to draw — same partner list as Church Partnerships, geocoded when lat/lng absent from API. */
  mapPins: ChurchMapPin[] = [];
  popover: any = null;
  showDonateButton: boolean = false;
  mapLoadError = false;
  loading = true;

  constructor(
    private ngZone: NgZone,
    private popoverController: PopoverController,
    private donateButtonService: DonateButtonService,
    private donateActionSheetService: DonateActionSheetService,
    private googleMapsLoader: GoogleMapsLoaderService,
    private addressGeocoding: AddressGeocodingService,
    private platformApi: PlatformApiService
  ) {}

  ngOnInit() {
    this.loadPartners();
    this.showDonateButton = this.donateButtonService.shouldShowDonateButton();
  }

  ngOnDestroy() {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
    this.map = null;
  }

  openDonateMenu() {
    this.donateActionSheetService.openDonateActionSheet();
  }

  /** Prefer coordinates from API when present. */
  private getPartnerLatLng(p: PlatformPartner): { lat: number; lng: number } | null {
    const addr = p.address;
    if (!addr) return null;
    const raw = addr as unknown as Record<string, unknown>;
    const latVal = addr.latitude ?? raw['lat'];
    const lngVal = addr.longitude ?? raw['lng'] ?? raw['long'];
    const lat = typeof latVal === 'string' ? parseFloat(latVal) : latVal;
    const lng = typeof lngVal === 'string' ? parseFloat(lngVal) : lngVal;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat: lat as number, lng: lng as number };
  }

  loadPartners(): void {
    this.loading = true;
    this.mapLoadError = false;
    this.mapPins = [];
    this.platformApi.getOrganizationPartners().subscribe({
      next: (items) => {
        void this.resolvePinsForPartners(items ?? []);
      },
      error: (err) => {
        console.error('ChurchMap: failed to load organization partners', err);
        this.loading = false;
        this.mapPins = [];
      },
    });
  }

  /** Build pins using API coordinates or the same geocoding pipeline as tapping an address on Church Partnerships. */
  private async resolvePinsForPartners(partners: PlatformPartner[]): Promise<void> {
    if (partners.length === 0) {
      this.ngZone.run(() => {
        this.loading = false;
      });
      return;
    }

    try {
      await this.googleMapsLoader.load();
    } catch (err) {
      console.warn('ChurchMap: Google Maps failed to load', err);
      this.ngZone.run(() => {
        this.loading = false;
        this.mapLoadError = true;
      });
      return;
    }

    const pins: ChurchMapPin[] = [];
    try {
      for (const partner of partners) {
        const fromApi = this.getPartnerLatLng(partner);
        if (fromApi) {
          pins.push({ partner, lat: fromApi.lat, lng: fromApi.lng });
          continue;
        }
        const addrLine = this.formatAddress(partner);
        if (addrLine === 'Address not available') {
          continue;
        }
        try {
          const pos = await this.addressGeocoding.resolveLatLng(addrLine);
          if (pos) {
            pins.push({ partner, lat: pos.lat, lng: pos.lng });
          }
        } catch (geocodeErr) {
          console.warn('ChurchMap: geocode failed for partner', partner.name, geocodeErr);
        }
      }
    } finally {
      this.ngZone.run(() => {
        this.mapPins = pins;
        this.loading = false;
        if (pins.length > 0) {
          setTimeout(() => void this.initMap(), 100);
        }
      });
    }
  }

  async initMap(): Promise<void> {
    if (this.mapPins.length === 0) {
      return;
    }
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      setTimeout(() => void this.initMap(), 100);
      return;
    }

    try {
      await this.googleMapsLoader.load();
    } catch (err) {
      console.warn('ChurchMap: Google Maps failed to load', err);
      this.ngZone.run(() => (this.mapLoadError = true));
      return;
    }

    const first = this.mapPins[0];
    const bounds = new google.maps.LatLngBounds();
    this.mapPins.forEach((pin) => bounds.extend({ lat: pin.lat, lng: pin.lng }));

    if (!this.map) {
      this.map = new google.maps.Map(mapElement, {
        zoom: 13,
        center: { lat: first.lat, lng: first.lng },
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
    }

    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];

    this.mapPins.forEach((pin) => {
      const position = { lat: pin.lat, lng: pin.lng };
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title: pin.partner.name,
        animation: google.maps.Animation.DROP,
      });
      marker.addListener('click', () => {
        this.ngZone.run(() => {
          void this.showChurchPopover(marker, pin.partner);
        });
      });
      this.markers.push(marker);
    });

    if (this.mapPins.length === 1) {
      this.map.setCenter({ lat: first.lat, lng: first.lng });
      this.map.setZoom(14);
    } else {
      this.map.fitBounds(bounds, { top: 64, right: 48, bottom: 48, left: 48 });
    }
  }

  async showChurchPopover(marker: any, partner: PlatformPartner) {
    if (this.popover) {
      await this.popover.dismiss();
    }

    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;

    const latLng = marker.getPosition();
    const overlay = new google.maps.OverlayView();
    overlay.setMap(this.map);

    let placed = false;

    const tryPresentAtPin = (): void => {
      if (placed) return;
      const projection = overlay.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToContainerPixel(latLng);
      if (!point) return;

      placed = true;
      overlay.setMap(null);

      const rect = mapDiv.getBoundingClientRect();
      const clientX = rect.left + point.x;
      const clientY = rect.top + point.y;

      const triggerEl = document.createElement('div');
      triggerEl.style.position = 'fixed';
      triggerEl.style.left = `${clientX}px`;
      triggerEl.style.top = `${clientY}px`;
      triggerEl.style.width = '1px';
      triggerEl.style.height = '1px';
      triggerEl.style.pointerEvents = 'none';
      document.body.appendChild(triggerEl);

      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        view: window,
      });
      Object.defineProperty(event, 'target', { value: triggerEl, enumerable: true });

      const addr = this.formatAddress(partner);

      this.ngZone.run(() => {
        void this.popoverController
          .create({
            component: LocationPopoverComponent,
            componentProps: {
              title: partner.name,
              address: addr === 'Address not available' ? null : addr,
              phone: partner.phone?.trim() || null,
              website: partner.website?.trim() || null,
              detail: partner.shortDescription?.trim() || null,
              hours: null,
              items: [],
            },
            event,
            showBackdrop: false,
            cssClass: 'location-popover',
            arrow: false,
          })
          .then(async (p) => {
            this.popover = p;
            p.onDidDismiss().then(() => {
              this.popover = null;
              triggerEl.remove();
            });
            await p.present();
          })
          .catch((err) => {
            console.warn('ChurchMap: popover failed', err);
            triggerEl.remove();
          });
      });
    };

    overlay.onAdd = () => {};
    overlay.draw = () => {
      tryPresentAtPin();
    };
  }

  formatAddress(partner: PlatformPartner): string {
    const addr = partner.address;
    if (!addr) return 'Address not available';
    const parts = [addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
    return parts.join(', ') || 'Address not available';
  }
}
