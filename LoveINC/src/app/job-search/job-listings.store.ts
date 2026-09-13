import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AddressGeocodingService } from '../services/address-geocoding.service';
import { PlatformApiService } from '../services/platform';
import type {
  PlatformJobListing,
  PlatformJobListingsOrigin,
  PlatformOrganization,
} from '../services/platform/types';
import { isUsableOrigin, type CompanySort, type DistanceOrigin } from './job-listing.mapper';

@Injectable({ providedIn: 'root' })
export class JobListingsStore {
  private readonly api = inject(PlatformApiService);
  private readonly geocoder = inject(AddressGeocodingService);
  private jobs: PlatformJobListing[] = [];
  private loaded = false;
  private origin: PlatformJobListingsOrigin | null = null;
  private affiliateCity: string | null = null;
  private companySort: CompanySort = 'date';
  private locationCache = new Map<string, DistanceOrigin | null>();
  private jobCoordsPromise: Promise<void> | null = null;

  load(force = false): Observable<PlatformJobListing[]> {
    if (this.loaded && !force) {
      return of(this.jobs);
    }
    return forkJoin({
      listings: this.api.getJobListings(),
      org: this.api.getOrganization().pipe(catchError(() => of(null))),
    }).pipe(
      map(({ listings, org }) => {
        this.jobs = listings.jobs ?? [];
        this.applyOrigin(listings.origin ?? null, org);
        this.loaded = true;
        if (this.companySort === 'distance' && !this.canSortByDistance()) {
          this.companySort = 'date';
        }
        this.jobCoordsPromise = this.fillMissingCoordinates(org);
        return this.jobs;
      }),
      catchError((err) => {
        console.error('JobListingsStore.load', err);
        this.jobs = [];
        this.origin = null;
        this.affiliateCity = null;
        this.loaded = true;
        if (this.companySort === 'distance') this.companySort = 'date';
        return of([]);
      }),
    );
  }

  ensureJobCoordinates(): Promise<void> {
    return this.jobCoordsPromise ?? Promise.resolve();
  }

  peek(): PlatformJobListing[] {
    return this.jobs;
  }

  getOrigin(): PlatformJobListingsOrigin | null {
    return this.origin;
  }

  getAffiliateCity(): string | null {
    return this.affiliateCity;
  }

  getDistanceOrigin(): DistanceOrigin | null {
    return isUsableOrigin(this.origin) ? this.origin : null;
  }

  canSortByDistance(): boolean {
    return !!this.distanceSortZip();
  }

  distanceSortLabel(): string | null {
    const zip = this.distanceSortZip();
    return zip ? `Distance from ${zip}` : null;
  }

  getSort(): CompanySort {
    return this.companySort;
  }

  setSort(sort: CompanySort): void {
    if (sort === 'distance' && !this.canSortByDistance()) {
      this.companySort = 'date';
      return;
    }
    this.companySort = sort;
  }

  private distanceSortZip(): string | null {
    const zip = this.origin?.zip?.trim();
    return zip || null;
  }

  private applyOrigin(
    apiOrigin: PlatformJobListingsOrigin | null,
    org: PlatformOrganization | null,
  ): void {
    const zip = (apiOrigin?.zip || org?.zip || '').trim();
    const city = (org?.city || '').trim();
    this.affiliateCity = city || null;
    const fromApi = isUsableOrigin(apiOrigin) ? apiOrigin : null;
    const fromOrg = isUsableOrigin(org) ? org : null;
    this.origin = zip
      ? {
          zip,
          latitude: fromApi?.latitude ?? fromOrg?.latitude ?? null,
          longitude: fromApi?.longitude ?? fromOrg?.longitude ?? null,
        }
      : apiOrigin;
  }

  private async fillMissingCoordinates(org: PlatformOrganization | null): Promise<void> {
    if (this.origin?.zip && !isUsableOrigin(this.origin) && org) {
      const query = [org.address, org.city, org.state, org.zip].filter(Boolean).join(', ');
      const pos = query ? await this.geocoder.resolveLatLng(query) : null;
      if (pos && this.origin) {
        this.origin = { ...this.origin, latitude: pos.lat, longitude: pos.lng };
      }
    }
    const labels = new Set<string>();
    for (const job of this.jobs) {
      if (job.latitude != null && job.longitude != null) continue;
      const label = (job.locations ?? []).map((loc) => loc.trim()).find(Boolean);
      if (label) labels.add(label);
    }
    for (const label of labels) {
      if (this.locationCache.has(label)) continue;
      const pos = await this.geocoder.resolveLatLng(label);
      this.locationCache.set(
        label,
        pos ? { latitude: pos.lat, longitude: pos.lng } : null,
      );
    }
    for (const job of this.jobs) {
      if (job.latitude != null && job.longitude != null) continue;
      const label = (job.locations ?? []).map((loc) => loc.trim()).find(Boolean);
      if (!label) continue;
      const coords = this.locationCache.get(label);
      if (!coords) continue;
      job.latitude = coords.latitude;
      job.longitude = coords.longitude;
    }
  }
}
