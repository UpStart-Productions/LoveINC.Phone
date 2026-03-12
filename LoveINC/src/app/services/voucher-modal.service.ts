import { Injectable } from '@angular/core';
import type { Voucher } from '@upstart-productions/service-unlock/src/lib/types/service-unlock.types';

/**
 * Holds the voucher to display when opening the voucher detail modal.
 * Used to reliably pass voucher data (including location, providerOffering) to the modal,
 * which can have issues receiving @Input from ModalController componentProps.
 */
@Injectable({ providedIn: 'root' })
export class VoucherModalService {
  private _voucher: Voucher | null = null;

  setVoucher(voucher: Voucher): void {
    this._voucher = voucher;
  }

  getVoucher(): Voucher | null {
    return this._voucher;
  }

  clear(): void {
    this._voucher = null;
  }
}
