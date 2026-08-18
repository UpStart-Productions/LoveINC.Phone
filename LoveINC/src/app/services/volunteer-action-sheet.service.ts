import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { VolunteerModalComponent } from '../components/volunteer-modal/volunteer-modal.component';
import { LOVE_INC_PUBLIC_NAME } from '../shared/love-inc-contact.constants';
import { GapAccessService } from './gap-access.service';
import { PlatformApiService } from './platform/platform-api.service';

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
    private gapAccess: GapAccessService,
    private platformApi: PlatformApiService
  ) {}

  /** Home CTA — generic interest signup, not tied to a specific open position. */
  async openGeneralVolunteerSignup(): Promise<void> {
    const org = await firstValueFrom(
      this.platformApi.getOrganization().pipe(catchError(() => of(null)))
    );

    const modal = await this.modalController.create({
      component: VolunteerModalComponent,
      componentProps: {
        organizationName: LOVE_INC_PUBLIC_NAME,
        affiliateId: org?.id ?? environment.tenantSlug,
        genericSignup: true,
      },
      cssClass: 'alerts-modal-sheet',
      presentingElement: await this.modalController.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
    });
    await modal.present();
  }

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
