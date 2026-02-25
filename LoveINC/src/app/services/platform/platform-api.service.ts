import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  PlatformAddress,
  PlatformClass,
  PlatformCta,
  PlatformDonation,
  PlatformEvent,
  PlatformHomeFeedItem,
  PlatformImpactStory,
  PlatformOrganization,
  PlatformService,
} from './types';

export type {
  PlatformAddress,
  PlatformClass,
  PlatformCta,
  PlatformDonation,
  PlatformEvent,
  PlatformHomeFeedItem,
  PlatformImpactStory,
  PlatformOffering,
  PlatformOrganization,
  PlatformService,
} from './types';

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
  private readonly basePath: string;
  private readonly headers: HttpHeaders;

  constructor(private readonly http: HttpClient) {
    const { apiBaseUrl, apiKey, customerSlug, tenantSlug } = environment;
    this.basePath = `${apiBaseUrl.replace(/\/$/, '')}/public/${customerSlug}/${tenantSlug}`;
    this.headers = new HttpHeaders({
      'x-api-key': apiKey || '',
      'Content-Type': 'application/json',
    });
  }

  /** Resolve upload path (e.g. /api/uploads/...) to full URL for images */
  resolveUploadUrl(path: string | undefined): string {
    if (!path?.trim()) return '';
    if (path.startsWith('http')) return path;
    const base = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private get<T>(path: string): Observable<T> {
    if (!environment.apiKey) {
      console.warn(
        'PlatformApiService: apiKey not configured. Set it in environment.ts'
      );
      return of(null as T);
    }
    const url = `${this.basePath}${path}`;
    return this.http.get<T>(url, { headers: this.headers }).pipe(
      tap((res) => {
        if (res != null) {
          console.debug(`PlatformApiService: ${path} OK`, res);
        }
      }),
      catchError((err) => {
        console.error(
          `PlatformApiService: failed to load ${path}`,
          'URL:',
          url,
          err?.status != null ? `Status: ${err.status}` : '',
          err?.message ?? err
        );
        if (err?.status === 0) {
          console.warn(
            'PlatformApiService: Status 0 often means CORS blocked the response. ' +
              'Ensure api.grovlink.com allows your origin (e.g. http://localhost:8100) or use a dev proxy.'
          );
        }
        return of(null as T);
      })
    );
  }

  getOrganization(): Observable<PlatformOrganization | null> {
    return this.get<PlatformOrganization>('/organization');
  }

  getEvents(): Observable<PlatformEvent[]> {
    return this.get<{ events: PlatformEvent[] }>('/events').pipe(
      map((res) => res?.events ?? [])
    );
  }

  getClasses(): Observable<PlatformClass[]> {
    return this.get<{ classes: PlatformClass[] }>('/classes').pipe(
      map((res) => res?.classes ?? [])
    );
  }

  getServices(): Observable<PlatformService[]> {
    return this.get<{ services: PlatformService[] }>('/services').pipe(
      map((res) => res?.services ?? [])
    );
  }

  getCtas(): Observable<PlatformCta[]> {
    return this.get<{ ctas: PlatformCta[] }>('/ctas').pipe(
      map((res) => res?.ctas ?? [])
    );
  }

  getImpactStories(): Observable<PlatformImpactStory[]> {
    return this.get<{ impactStories: PlatformImpactStory[] }>('/impact-stories').pipe(
      map((res) => res?.impactStories ?? [])
    );
  }

  getHomeFeed(): Observable<PlatformHomeFeedItem[]> {
    return this.get<{ items: PlatformHomeFeedItem[] }>('/home-feed').pipe(
      map((res) => res?.items ?? [])
    );
  }

  getDonations(): Observable<PlatformDonation[]> {
    return this.get<{ donations: PlatformDonation[] }>('/donations').pipe(
      map((res) => res?.donations ?? [])
    );
  }
}
