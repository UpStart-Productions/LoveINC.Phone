import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

export interface OpenLocationMapModalOptions {
  /** Title in modal header and popover (e.g. organization or place name). */
  title: string;
  /** Full address string for geocoding. */
  address: string;
  /** When set with longitude, the map uses this position and skips geocoding. */
  latitude?: number;
  longitude?: number;
  hours?: string | null;
  acceptedItems?: string[];
  /** Ionic icon for optional items row in popover (default gift-outline). */
  itemsIcon?: string;
  /** Optional contact rows in the map popover (e.g. church partners). */
  phone?: string | null;
  website?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LocationMapModalService {
  constructor(private modalController: ModalController) {}

  /** Opens fullscreen map with pin; popover shows after map settles. */
  async present(options: OpenLocationMapModalOptions): Promise<void> {
    const addr = options.address?.trim() ?? '';
    const lat = options.latitude;
    const lng = options.longitude;
    const hasValidCoords =
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180;
    if (!addr && !hasValidCoords) return;
    const { DonationLocationMapModalComponent } = await import(
      '../components/donation-location-map-modal/donation-location-map-modal.component'
    );
    const modal = await this.modalController.create({
      component: DonationLocationMapModalComponent,
      componentProps: {
        organization: options.title,
        address: addr,
        latitude: hasValidCoords ? lat : undefined,
        longitude: hasValidCoords ? lng : undefined,
        hours: options.hours ?? null,
        acceptedItems: options.acceptedItems ?? [],
        itemsIcon: options.itemsIcon ?? 'gift-outline',
        phone: options.phone?.trim() || null,
        website: options.website?.trim() || null,
      },
      cssClass: 'donation-map-modal-fullscreen',
    });
    await modal.present();
  }
}
