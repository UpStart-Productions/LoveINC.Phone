import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PlatformApiService } from '../services/platform';
import type { PlatformJobListing } from '../services/platform/types';

@Injectable({ providedIn: 'root' })
export class JobListingsStore {
  private readonly api = inject(PlatformApiService);
  private jobs: PlatformJobListing[] = [];
  private loaded = false;

  load(force = false): Observable<PlatformJobListing[]> {
    if (this.loaded && !force) {
      return of(this.jobs);
    }
    return this.api.getJobListings().pipe(
      tap((res) => {
        this.jobs = res.jobs ?? [];
        this.loaded = true;
      }),
      map((res) => res.jobs ?? []),
      catchError((err) => {
        console.error('JobListingsStore.load', err);
        this.jobs = [];
        this.loaded = true;
        return of([]);
      }),
    );
  }

  peek(): PlatformJobListing[] {
    return this.jobs;
  }
}
