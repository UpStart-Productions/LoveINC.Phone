import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { ServiceUnlockService } from '../services/service-unlock.service';
import type { Voucher } from '../types/service-unlock.types';

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 'mock-1',
    serviceId: 'diapers-and-more',
    serviceLabel: 'Diapers & More',
    status: 'approved',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    shortDescription: 'Essential supplies for families with young children',
  },
  {
    id: 'mock-2',
    serviceId: 'linens',
    serviceLabel: 'Linens',
    status: 'approved',
    requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shortDescription: 'Bedding and household linens',
  },
];

@Component({
  selector: 'app-service-access-section',
  templateUrl: './service-access-section.component.html',
  styleUrls: ['./service-access-section.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
  ],
})
export class ServiceAccessSectionComponent implements OnInit, OnDestroy, OnChanges {
  isUnlocked = false;
  vouchers: Voucher[] = [];
  /** Voucher IDs whose photo failed to load - show placeholder instead */
  photoLoadFailed = new Set<string>();

  private subs: Subscription[] = [];

  /** If provided, called when Scan QR Code is clicked instead of navigating. Use to show profile form first. */
  @Input() scanClickHandler?: () => void | Promise<void>;

  /** When provided, use these vouchers instead of mock data. Empty array = no vouchers. Omit = use mock. */
  @Input() apiVouchers: Voucher[] | null = null;

  /** When true, treat intake as completed (from API). Combined with local unlock for display. */
  @Input() apiIntakeCompleted?: boolean;

  /** When false, org does not require intake—user has full access without scanning. */
  @Input() intakeRequired = true;

  /** Customer/organization name for intake-completed message (e.g. "Love INC"). */
  @Input() customerName = 'Love INC';

  /** Emitted when a valid voucher is tapped. Host app can open modal. */
  @Output() voucherTap = new EventEmitter<Voucher>();

  /** Emitted when user taps delete on an expired/used voucher. Host app should remove from local display. */
  @Output() voucherRemove = new EventEmitter<Voucher>();

  constructor(
    private service: ServiceUnlockService,
    private router: Router
  ) {}

  /** User has completed intake (scanned QR). */
  get intakeCompleted(): boolean {
    return this.isUnlocked || !!this.apiIntakeCompleted;
  }

  /** Display state: 'full_access' | 'required' | 'completed' */
  get accessStatus(): 'full_access' | 'required' | 'completed' {
    if (!this.intakeRequired) return 'full_access';
    return this.intakeCompleted ? 'completed' : 'required';
  }

  async ngOnInit(): Promise<void> {
    await this.service.ensureInitialized();
    this.subs.push(
      this.service.isUnlocked$.subscribe((u) => (this.isUnlocked = u)),
      this.service.getVouchers().subscribe((v) => {
        if (this.apiVouchers === null) {
          this.vouchers = v;
        }
      })
    );
    this.applyVouchers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['apiVouchers']) {
      this.applyVouchers();
    }
  }

  private applyVouchers(): void {
    this.vouchers = this.apiVouchers !== null ? [...this.apiVouchers] : [...MOCK_VOUCHERS];
    this.photoLoadFailed.clear();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  isVoucherValid(v: Voucher): boolean {
    return v.status === 'approved' && new Date(v.validUntil) > new Date();
  }

  isVoucherExpiredOrUsed(v: Voucher): boolean {
    return v.status === 'expired' || v.status === 'redeemed';
  }

  hasExpiry(v: Voucher): boolean {
    return !!v.expiresAt;
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

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatExpDay(iso: string): string {
    return new Date(iso).getDate().toString();
  }

  formatExpMonth(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  }

  async goToScan(): Promise<void> {
    if (this.scanClickHandler) {
      await this.scanClickHandler();
    } else {
      this.router.navigate(['/tabs/service-unlock/scan']);
    }
  }

}
