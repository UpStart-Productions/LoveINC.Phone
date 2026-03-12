import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { VoucherModalService } from '../../services/voucher-modal.service';
import type { Voucher, VoucherLocation } from '@upstart-productions/service-unlock/src/lib/types/service-unlock.types';

declare var google: any;

@Component({
  selector: 'app-voucher-detail-modal',
  templateUrl: './voucher-detail-modal.component.html',
  styleUrls: ['./voucher-detail-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class VoucherDetailModalComponent implements AfterViewInit, OnDestroy {
  @Input() voucher!: Voucher;

  mapLoading = true;
  mapLoadError = false;
  geocodeError = false;
  modalPhotoLoadFailed = false;
  private map: any = null;

  constructor(
    private modalController: ModalController,
    private ngZone: NgZone,
    private googleMapsLoader: GoogleMapsLoaderService,
    private voucherModalService: VoucherModalService
  ) {}

  /** Resolved voucher: prefer service (set before modal open) for reliable location/providerOffering */
  get displayVoucher(): Voucher | null {
    const fromInput = this.voucher;
    const fromService = this.voucherModalService.getVoucher();
    if (fromService) {
      return { ...(fromInput ?? {}), ...fromService } as Voucher;
    }
    return fromInput ?? null;
  }

  formatExpDay(iso: string): string {
    return new Date(iso).getDate().toString();
  }

  formatExpMonth(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short' });
  }

  /** Format raw location for display: street, city state zip. Omit locationName (provider/building) since it's shown separately. */
  formatLocation(location: VoucherLocation | string | null | undefined): string {
    if (!location) return '';
    if (typeof location === 'object') {
      const lines = [
        location.address,
        `${location.city}, ${location.state} ${location.zip}`,
      ].filter(Boolean);
      return lines.join('\n');
    }
    return String(location).trim();
  }

  close(): void {
    this.modalController.dismiss();
  }

  redeem(): void {
    this.modalController.dismiss();
  }

  ngAfterViewInit(): void {
    const v = this.displayVoucher;
    if (v?.location) {
      this.initMap(v);
    } else {
      this.mapLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.map = null;
  }

  private async initMap(voucher?: Voucher | null): Promise<void> {
    const v = voucher ?? this.displayVoucher;
    const mapEl = document.getElementById('voucher-map');
    if (!mapEl) {
      setTimeout(() => this.initMap(v), 100);
      return;
    }

    try {
      await this.googleMapsLoader.load();
    } catch {
      this.ngZone.run(() => {
        this.mapLoading = false;
        this.mapLoadError = true;
      });
      return;
    }

    const loc = v?.location;
    if (!loc) {
      this.ngZone.run(() => {
        this.mapLoading = false;
      });
      return;
    }

    const address =
      typeof loc === 'object'
        ? [loc.address, loc.locationName, `${loc.city}, ${loc.state} ${loc.zip}`]
            .filter(Boolean)
            .join(', ')
        : String(loc).trim();

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any[] | null, status: string) => {
      this.ngZone.run(() => {
        this.mapLoading = false;
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
          gestureHandling: 'cooperative',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });
        const v = this.displayVoucher;
        new google.maps.Marker({
          position,
          map: this.map,
          title: v?.providerOffering ?? v?.serviceLabel,
          animation: google.maps.Animation.DROP,
        });
      });
    });
  }
}
