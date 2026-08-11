import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { VolunteerModalComponent } from '../components/volunteer-modal/volunteer-modal.component';
import { GapAccessService } from './gap-access.service';

/** Minimal volunteer position – usable from donations, services, content, etc. */
export interface VolunteerPositionInfo {
  id: string;
  title?: string;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  schedule?: string;
}

export interface OpenVolunteerModalOptions {
  organizationName: string;
  /** Place address, shown below the name in small grey text */
  address?: string | null;
  positions: VolunteerPositionInfo[];
  /** Fallback schedule when a position has none (e.g. location hours) */
  scheduleFallback?: string;
  /** When true, address is hidden until client intake QR unlock (Gap Ministry). */
  fromGapMinistry?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VolunteerActionSheetService {
  constructor(
    private modalController: ModalController,
    private gapAccess: GapAccessService
  ) {}

  async openVolunteerActionSheet(options: OpenVolunteerModalOptions): Promise<void> {
    const { organizationName, positions, scheduleFallback, fromGapMinistry } = options;
    let address = options.address ?? null;
    if (!positions?.length) return;

    if (fromGapMinistry) {
      await this.gapAccess.refreshState();
      if (this.gapAccess.orgIntakeRequired && !this.gapAccess.hasProviderContactAccess) {
        address = null;
      }
    }

    const modal = await this.modalController.create({
      component: VolunteerModalComponent,
      componentProps: {
        organizationName,
        address,
        locationHours: scheduleFallback ?? null,
        positions,
      },
      cssClass: 'alerts-modal-sheet',
      presentingElement: await this.modalController.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
    });
    await modal.present();
  }
}
