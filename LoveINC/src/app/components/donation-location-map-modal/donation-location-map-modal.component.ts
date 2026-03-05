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
  @Input() hours: string | null = null;
  @Input() acceptedItems: string[] = [];
  @Input() itemsIcon = 'gift-outline';

  loading = true;
  geocodeError = false;
  mapLoadError = false;
  private map: any = null;
  private popover: any = null;

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
    this.initMap();
  }

  ngOnDestroy() {
    this.map = null;
    if (this.popover) {
      this.popover.dismiss();
    }
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

    if (!this.address?.trim()) {
      this.ngZone.run(() => {
        this.loading = false;
        this.geocodeError = true;
      });
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: this.address }, (results: any[] | null, status: string) => {
      this.ngZone.run(() => {
        this.loading = false;
        if (status !== 'OK' || !results?.[0]) {
          this.geocodeError = true;
          return;
        }
        const place = results[0];
        const position = place.geometry.location;
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
      });
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
