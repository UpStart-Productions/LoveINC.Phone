import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { ServiceUnlockService } from '../services/service-unlock.service';
import type { Voucher } from '../types/service-unlock.types';

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
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
  ],
})
export class ServiceAccessSectionComponent implements OnInit, OnDestroy {
  isUnlocked = false;
  vouchers: Voucher[] = [
    {
      id: 'mock-1',
      serviceId: 'diapers-and-more',
      serviceLabel: 'Diapers & More',
      status: 'approved',
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-2',
      serviceId: 'linens',
      serviceLabel: 'Linens',
      status: 'approved',
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  private subs: Subscription[] = [];

  /** If provided, called when Scan QR Code is clicked instead of navigating. Use to show profile form first. */
  @Input() scanClickHandler?: () => void | Promise<void>;

  constructor(
    private service: ServiceUnlockService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.service.ensureInitialized();
    this.subs.push(
      this.service.isUnlocked$.subscribe((u) => (this.isUnlocked = u)),
      this.service.getVouchers().subscribe((v) => (this.vouchers = v))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  isVoucherValid(v: Voucher): boolean {
    return v.status === 'approved' && new Date(v.validUntil) > new Date();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  async goToScan(): Promise<void> {
    if (this.scanClickHandler) {
      await this.scanClickHandler();
    } else {
      this.router.navigate(['/tabs/service-unlock/scan']);
    }
  }

  requestVoucher(): void {
    // Placeholder - will POST to API when wired
    console.log('Request voucher - API not yet wired');
  }
}
