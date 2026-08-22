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
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { AddressGeocodingService } from '../../services/address-geocoding.service';

declare var google: any;

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
  @Input() phone: string | null = null;
  @Input() website: string | null = null;

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
    private googleMapsLoader: GoogleMapsLoaderService,
    private addressGeocoding: AddressGeocodingService
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

  private buildMapWithPosition(mapEl: HTMLElement, position: { lat: number; lng: number }): void {
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
        void this.showLocationPopover(marker);
      });
    });

    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      this.ngZone.run(() => this.tryShowInitialPopover(marker));
    });
    setTimeout(() => {
      this.ngZone.run(() => this.tryShowInitialPopover(marker));
    }, 400);
  }

  private tryShowInitialPopover(marker: any): void {
    if (this.initialPopoverShown) return;
    this.initialPopoverShown = true;
    void this.showLocationPopover(marker);
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

    const position = await this.addressGeocoding.resolveLatLng(this.address ?? '');
    this.ngZone.run(() => {
      this.loading = false;
      if (position) {
        this.geocodeError = false;
        this.buildMapWithPosition(mapEl, position);
      } else {
        this.geocodeError = true;
        console.warn('DonationLocationMapModal: all geocoding strategies failed for', this.address);
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
    let placed = false;

    const tryPresentAtPin = (): void => {
      if (placed) return;
      const projection = overlay.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToContainerPixel(position);
      if (!point) return;

      placed = true;
      overlay.setMap(null);

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
      Object.defineProperty(event, 'target', { value: triggerEl, enumerable: true });

      this.ngZone.run(() => {
        void (async () => {
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
              phone: this.phone?.trim() || null,
              website: this.website?.trim() || null,
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
        })();
      });
    };

    overlay.onAdd = () => {};
    overlay.draw = () => {
      tryPresentAtPin();
    };
    overlay.setMap(this.map);
  }
}
