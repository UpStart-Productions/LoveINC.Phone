import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';

export interface OpenLocationMapModalOptions {
  /** Title in modal header and popover (e.g. organization or place name). */
  title: string;
  /** Full address string for geocoding. */
  address: string;
  hours?: string | null;
  acceptedItems?: string[];
  /** Ionic icon for optional items row in popover (default gift-outline). */
  itemsIcon?: string;
}

@Injectable({ providedIn: 'root' })
export class LocationMapModalService {
  constructor(private modalController: ModalController) {}

  /** Opens fullscreen map with pin; popover shows after map settles. */
  async present(options: OpenLocationMapModalOptions): Promise<void> {
    const addr = options.address?.trim();
    if (!addr) return;
    const { DonationLocationMapModalComponent } = await import(
      '../components/donation-location-map-modal/donation-location-map-modal.component'
    );
    const modal = await this.modalController.create({
      component: DonationLocationMapModalComponent,
      componentProps: {
        organization: options.title,
        address: addr,
        hours: options.hours ?? null,
        acceptedItems: options.acceptedItems ?? [],
        itemsIcon: options.itemsIcon ?? 'gift-outline',
      },
      cssClass: 'donation-map-modal-fullscreen',
    });
    await modal.present();
  }
}
