import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CapacitorHttp } from '@capacitor/core';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';

declare var google: any;

/** Improves geocode hits for this affiliate when street-only or ambiguous strings are used. */
const TENANT_GEOCODE_SUFFIX = ', Newberg, OR, USA';

@Component({
  selector: 'app-donation-location-map-modal',
  templateUrl: './donation-location-map-modal.component.html',
  styleUrls: ['./donation-location-map-modal.component.scss'],
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
    IonSpinner,
  ],
})
export class DonationLocationMapModalComponent implements AfterViewInit, OnDestroy {
  @Input() organization = '';
  @Input() address = '';
  @Input() latitude: number | undefined;
  @Input() longitude: number | undefined;
  @Input() hours: string | null = null;
  @Input() acceptedItems: string[] = [];
  @Input() itemsIcon = 'gift-outline';

  loading = true;
  geocodeError = false;
  mapLoadError = false;
  private map: any = null;
  private popover: any = null;
  private initialPopoverShown = false;

  constructor(
    private modalController: ModalController,
    private popoverController: PopoverController,
    private ngZone: NgZone,
    private googleMapsLoader: GoogleMapsLoaderService
  ) {}

  async dismiss() {
    await this.modalController.dismiss();
  }

  ngAfterViewInit() {
    // Defer so Ionic modal has applied @Input() from componentProps.
    setTimeout(() => void this.initMap(), 0);
  }

  ngOnDestroy() {
    this.map = null;
    if (this.popover) {
      this.popover.dismiss();
    }
  }

  private isValidMapCoordinate(lat: number | undefined, lng: number | undefined): boolean {
    if (lat === undefined || lng === undefined) return false;
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  /** Strips HTML and normalizes newlines (CMS/API may include markup). */
  private normalizeForGeocode(raw: string): string {
    const noTags = raw.replace(/<[^>]+>/g, ' ');
    return noTags
      .replace(/\r\n|\n|\r/g, ', ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim();
  }

  /**
   * Resolves a place string to coordinates. Tries Google Geocoder, then a
   * Nominatim (OSM) request via CapacitorHttp. Google’s JS Geocoder needs the
   * Geocoding API enabled on the same GCP project as the key; if that is off or
   * the key is mis-restricted, Google returns REQUEST_DENIED and the OSM path still works.
   */
  private geocodeGooglePromise(address: string): Promise<any | null> {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address, region: 'us' }, (results: any[] | null, status: string) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          resolve(results[0].geometry.location);
          return;
        }
        if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
          console.warn('DonationLocationMapModal: Google Geocoder', status, address);
        }
        resolve(null);
      });
    });
  }

  private async geocodeNominatimUs(query: string): Promise<{ lat: number; lng: number } | null> {
    const q = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=us`;
    try {
      const { status, data } = await CapacitorHttp.get({
        url,
        headers: {
          'User-Agent': 'LoveINCMobile/1.0 (Grovlink; nonprofit app)',
          Accept: 'application/json',
        },
      });
      if (status !== 200) return null;
      const rows = typeof data === 'string' ? (JSON.parse(data) as unknown) : data;
      if (!Array.isArray(rows) || !rows[0]) return null;
      const r = rows[0] as { lat?: string; lon?: string };
      const lat = r.lat != null ? parseFloat(r.lat) : NaN;
      const lng = r.lon != null ? parseFloat(r.lon) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { lat, lng };
    } catch (e) {
      console.warn('DonationLocationMapModal: Nominatim request failed', e);
      return null;
    }
  }

  private async resolvePositionForAddress(address: string): Promise<any | null> {
    let pos = await this.geocodeGooglePromise(address);
    if (pos) return pos;
    if (!/\b(OR|Oregon|97132)\b/i.test(address) && !address.includes(TENANT_GEOCODE_SUFFIX)) {
      pos = await this.geocodeGooglePromise(address + TENANT_GEOCODE_SUFFIX);
      if (pos) return pos;
    }
    let osm = await this.geocodeNominatimUs(address);
    if (osm) return osm;
    if (!/\b(OR|Oregon|97132)\b/i.test(address) && !address.includes(TENANT_GEOCODE_SUFFIX)) {
      osm = await this.geocodeNominatimUs(address + TENANT_GEOCODE_SUFFIX);
    }
    return osm;
  }

  private buildMapWithPosition(mapEl: HTMLElement, position: any): void {
    this.map = new google.maps.Map(mapEl, {
      zoom: 15,
      center: position,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });
    const marker = new google.maps.Marker({
      position,
      map: this.map,
      title: this.organization,
      animation: google.maps.Animation.DROP,
    });

    marker.addListener('click', () => {
      this.ngZone.run(() => {
        this.showLocationPopover(marker);
      });
    });

    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      this.ngZone.run(() => {
        if (!this.initialPopoverShown) {
          this.initialPopoverShown = true;
          this.showLocationPopover(marker);
        }
      });
    });
  }

  private async initMap() {
    const mapEl = document.getElementById('donation-map');
    if (!mapEl) {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    try {
      await this.googleMapsLoader.load();
    } catch (err) {
      console.warn('DonationLocationMapModal: Google Maps failed to load', err);
      this.ngZone.run(() => {
        this.loading = false;
        this.mapLoadError = true;
      });
      return;
    }

    if (this.isValidMapCoordinate(this.latitude, this.longitude)) {
      this.ngZone.run(() => {
        this.loading = false;
        this.geocodeError = false;
        this.buildMapWithPosition(mapEl, { lat: this.latitude!, lng: this.longitude! });
      });
      return;
    }

    const normalized = this.normalizeForGeocode(this.address ?? '');
    if (!normalized) {
      this.ngZone.run(() => {
        this.loading = false;
        this.geocodeError = true;
      });
      return;
    }

    const position = await this.resolvePositionForAddress(normalized);
    this.ngZone.run(() => {
      this.loading = false;
      if (position) {
        this.geocodeError = false;
        this.buildMapWithPosition(mapEl, position);
      } else {
        this.geocodeError = true;
        console.warn('DonationLocationMapModal: all geocoding strategies failed for', normalized);
      }
    });
  }

  private async showLocationPopover(marker: any) {
    if (this.popover) {
      await this.popover.dismiss();
    }
    const mapEl = document.getElementById('donation-map');
    if (!mapEl) return;
    const position = marker.getPosition();
    const overlay = new google.maps.OverlayView();
    overlay.setMap(this.map);
    overlay.draw = function () {};
    const projection = overlay.getProjection();
    if (!projection) {
      google.maps.event.addListenerOnce(this.map, 'idle', () => this.showLocationPopover(marker));
      return;
    }
    const point = projection.fromLatLngToContainerPixel(position);
    const rect = mapEl.getBoundingClientRect();
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
    Object.defineProperty(event, 'target', { value: triggerEl });
    const { LocationPopoverComponent } = await import(
      '../location-popover/location-popover.component'
    );
    this.popover = await this.popoverController.create({
      component: LocationPopoverComponent,
      componentProps: {
        title: this.organization,
        address: this.address,
        hours: this.hours,
        items: this.acceptedItems,
        itemsIcon: this.itemsIcon,
      },
      event,
      showBackdrop: false,
      cssClass: 'location-popover',
      arrow: false,
    });
    this.popover.onDidDismiss().then(() => {
      this.popover = null;
      triggerEl.remove();
    });
    await this.popover.present();
  }
}
