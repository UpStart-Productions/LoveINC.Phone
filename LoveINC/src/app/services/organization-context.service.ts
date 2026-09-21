import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { setDisplayTimeZone } from '../shared/utils';
import {
  LOVE_INC_OFFICE_TEL,
  LOVE_INC_ONLINE_DONATE_URL_FALLBACK,
  LOVE_INC_PUBLIC_NAME,
} from '../shared/love-inc-contact.constants';
import { GrovLinkDatabaseService } from './grovlink-database.service';
import { PlatformApiService } from './platform/platform-api.service';
import type { PlatformCustomer, PlatformOrganization } from './platform/types';

const PREF_ORG = 'platform_organization';
const PREF_CUSTOMER = 'platform_customer';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private readonly orgSubject = new BehaviorSubject<PlatformOrganization | null>(null);
  private readonly customerSubject = new BehaviorSubject<PlatformCustomer | null>(null);
  private refreshPromise: Promise<void> | null = null;

  readonly organization$ = this.orgSubject.asObservable();
  readonly customer$ = this.customerSubject.asObservable();

  constructor(
    private readonly grovLinkDb: GrovLinkDatabaseService,
    private readonly platformApi: PlatformApiService,
  ) {
    void this.loadFromCache();
  }

  get organization(): PlatformOrganization | null {
    return this.orgSubject.value;
  }

  get customer(): PlatformCustomer | null {
    return this.customerSubject.value;
  }

  get publicName(): string {
    return this.orgSubject.value?.name?.trim() || LOVE_INC_PUBLIC_NAME;
  }

  get customerName(): string {
    const fromCustomer = this.customerSubject.value?.name?.trim();
    if (fromCustomer) return fromCustomer;
    const org = this.orgSubject.value;
    const fromOrg = org?.customerName?.trim() || org?.customer?.name?.trim();
    return fromOrg || LOVE_INC_PUBLIC_NAME;
  }

  get officeTel(): string {
    const raw = this.orgSubject.value?.phone?.trim();
    if (!raw) return LOVE_INC_OFFICE_TEL;
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 10 ? digits : LOVE_INC_OFFICE_TEL;
  }

  get formattedAddress(): string {
    const org = this.orgSubject.value;
    if (!org) return '';
    const line2 = [org.city, org.state].filter(Boolean).join(', ');
    const withZip = org.zip?.trim()
      ? `${line2}${line2 ? ' ' : ''}${org.zip.trim()}`
      : line2;
    return [org.address?.trim(), withZip].filter(Boolean).join(', ');
  }

  get geocodeSuffix(): string {
    const org = this.orgSubject.value;
    const city = org?.city?.trim();
    const state = org?.state?.trim();
    if (city && state) return `, ${city}, ${state}, USA`;
    if (city) return `, ${city}, USA`;
    return ', Newberg, OR, USA';
  }

  get donateUrl(): string {
    const website = this.orgSubject.value?.website?.trim();
    if (!website) return LOVE_INC_ONLINE_DONATE_URL_FALLBACK;
    const base = website.replace(/\/+$/, '');
    return `${base}/donate/`;
  }

  /** Load cached org/customer from SQLite, then refresh from API (idempotent per session). */
  initialize(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshFromApi();
    }
    return this.refreshPromise;
  }

  private async loadFromCache(): Promise<void> {
    try {
      const [orgJson, customerJson] = await Promise.all([
        this.grovLinkDb.getAppPreference(PREF_ORG),
        this.grovLinkDb.getAppPreference(PREF_CUSTOMER),
      ]);
      if (orgJson) {
        this.applyOrganization(JSON.parse(orgJson) as PlatformOrganization);
      }
      if (customerJson) {
        this.customerSubject.next(JSON.parse(customerJson) as PlatformCustomer);
      }
    } catch {
      // Keep fallbacks until API refresh succeeds.
    }
  }

  private async refreshFromApi(): Promise<void> {
    try {
      const { org, customer } = await firstValueFrom(
        forkJoin({
          org: this.platformApi.getOrganization().pipe(catchError(() => of(null))),
          customer: this.platformApi.getCustomer().pipe(catchError(() => of(null))),
        }),
      );
      if (org) {
        await this.grovLinkDb.setAppPreference(PREF_ORG, JSON.stringify(org));
        this.applyOrganization(org);
      }
      if (customer) {
        await this.grovLinkDb.setAppPreference(PREF_CUSTOMER, JSON.stringify(customer));
        this.customerSubject.next(customer);
      }
    } catch {
      // Offline — cached values remain.
    }
  }

  private applyOrganization(org: PlatformOrganization): void {
    this.orgSubject.next(org);
    if (org.timezone) {
      setDisplayTimeZone(org.timezone);
    }
  }
}
