import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { VoucherModalService } from '../../services/voucher-modal.service';
import { PlatformApiService } from '../../services/platform/platform-api.service';
import { LocationMapModalService } from '../../services/location-map-modal.service';
import type { Voucher, VoucherLocation } from '@upstart-productions/service-unlock/src/lib/types/service-unlock.types';

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
export class VoucherDetailModalComponent {
  @Input() voucher!: Voucher;
  @Input() deviceId?: string | null;
  @Input() email?: string | null;

  redeeming = false;
  modalPhotoLoadFailed = false;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private voucherModalService: VoucherModalService,
    private platformApi: PlatformApiService,
    private locationMapModal: LocationMapModalService
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

  /** Single-line address for geocoding (matches previous inline map behavior). */
  private geocodeAddressString(location: VoucherLocation | string): string {
    if (typeof location === 'object') {
      return [location.address, location.locationName, `${location.city}, ${location.state} ${location.zip}`]
        .filter(Boolean)
        .join(', ');
    }
    return String(location).trim();
  }

  async openVoucherLocationMap(ev: Event): Promise<void> {
    ev.stopPropagation();
    const v = this.displayVoucher;
    if (!v?.location) return;
    const address = this.geocodeAddressString(v.location);
    if (!address) return;
    await this.locationMapModal.present({
      title: v.providerOffering ?? v.serviceLabel ?? 'Location',
      address,
    });
  }

  close(): void {
    this.modalController.dismiss();
  }

  /** Whether this voucher can be redeemed (approved and not expired/redeemed). */
  get canRedeem(): boolean {
    const v = this.displayVoucher;
    if (!v || v.status !== 'approved') return false;
    if (v.expiresAt && new Date(v.expiresAt) <= new Date()) return false;
    return true;
  }

  async redeem(): Promise<void> {
    const v = this.displayVoucher;
    if (!v || !this.canRedeem) return;
    if (!this.deviceId && !this.email?.trim()) {
      const alert = await this.alertController.create({
        header: 'Cannot redeem',
        message: 'Please complete your profile with an email to redeem vouchers.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }
    this.redeeming = true;
    try {
      await this.platformApi.redeemVoucher(v.id, {
        deviceId: this.deviceId ?? undefined,
        email: this.email?.trim() || undefined,
      });
      this.modalController.dismiss({ redeemed: true });
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Could not redeem voucher. Please try again.';
      const alert = await this.alertController.create({
        header: 'Redeem failed',
        message: msg,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.redeeming = false;
    }
  }
}
