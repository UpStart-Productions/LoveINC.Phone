import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/angular/standalone';
import type { Voucher } from '../types/service-unlock.types';

@Component({
  selector: 'app-vouchers-panel',
  templateUrl: './vouchers-panel.component.html',
  styleUrls: ['./vouchers-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
  ],
})
export class VouchersPanelComponent implements OnInit, OnChanges {
  vouchers: Voucher[] = [];
  photoLoadFailed = new Set<string>();

  @Input() apiVouchers: Voucher[] | null = null;

  @Output() voucherTap = new EventEmitter<Voucher>();
  @Output() voucherRemove = new EventEmitter<Voucher>();

  ngOnInit(): void {
    this.applyVouchers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['apiVouchers']) {
      this.applyVouchers();
    }
  }

  private applyVouchers(): void {
    this.vouchers = this.apiVouchers ? [...this.apiVouchers] : [];
    this.photoLoadFailed.clear();
  }

  isVoucherValid(v: Voucher): boolean {
    return v.status === 'approved' && new Date(v.validUntil) > new Date();
  }

  isVoucherExpiredOrUsed(v: Voucher): boolean {
    return v.status === 'expired' || v.status === 'redeemed';
  }

  get hasAnyValidVoucher(): boolean {
    return this.vouchers.some((v) => this.isVoucherValid(v));
  }

  onVoucherCardClick(v: Voucher): void {
    if (!this.isVoucherExpiredOrUsed(v)) {
      this.voucherTap.emit(v);
    }
  }

  onRemoveVoucher(event: Event, v: Voucher): void {
    event.stopPropagation();
    this.voucherRemove.emit(v);
  }

  hasPhotoLoadFailed(id: string): boolean {
    return this.photoLoadFailed.has(id);
  }

  markPhotoFailed(id: string): void {
    this.photoLoadFailed.add(id);
  }

  formatExpDay(iso: string): string {
    return new Date(iso).getDate().toString();
  }

  formatExpMonth(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  }
}
