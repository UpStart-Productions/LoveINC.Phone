import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, tap, firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  PlatformAddress,
  PlatformClass,
  PlatformCta,
  PlatformDonation,
  PlatformEvent,
  PlatformHomeFeedItem,
  PlatformImpactStory,
  PlatformNotification,
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
  PlatformNotification,
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
            'PlatformApiService: Status 0 usually means network failure or blocked request.'
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

  getNotifications(): Observable<PlatformNotification[]> {
    return this.get<{ notifications: PlatformNotification[] }>('/notifications').pipe(
      map((res) => res?.notifications ?? [])
    );
  }

  /**
   * Register device for push notifications. Calls POST /public/:customerSlug/push/register.
   * Platform: 'ios' or 'android'. Token: APNs or FCM device token.
   */
  registerPushDevice(params: {
    platform: 'ios' | 'android';
    token: string;
    tenantSlug?: string;
  }): Promise<{ ok: boolean }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const { apiBaseUrl, apiKey, customerSlug } = environment;
    const url = `${apiBaseUrl.replace(/\/$/, '')}/public/${customerSlug}/push/register`;
    const body: { platform: string; token: string; tenantSlug?: string } = {
      platform: params.platform,
      token: params.token,
    };
    if (params.tenantSlug?.trim()) {
      body.tenantSlug = params.tenantSlug.trim();
    }
    const headers = new HttpHeaders({
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    });
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(url, body, { headers }).pipe(
        tap(() => console.debug('PlatformApiService: push/register OK')),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: push/register failed', {
            url,
            status,
            message,
            err,
          });
          throw err;
        })
      )
    );
  }

  /**
   * Validate intake phrase and complete intake. Creates/updates AppUser and CustomerIntakeCompletion.
   * POST /public/:customerSlug/:tenantSlug/intake/validate
   */
  validateIntakePhrase(params: {
    phrase: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ success: boolean; intakeCompleted: boolean }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/intake/validate`;
    const body: Record<string, string> = {
      phrase: params.phrase.trim(),
      email: params.email.trim(),
    };
    if (params['firstName']?.trim()) body['firstName'] = params['firstName'].trim();
    if (params['lastName']?.trim()) body['lastName'] = params['lastName'].trim();

    return firstValueFrom(
      this.http
        .post<{ success: boolean; intakeCompleted: boolean }>(url, body, {
          headers: this.headers,
          responseType: 'json',
        })
        .pipe(
          tap((res) => console.debug('PlatformApiService: intake/validate OK', res)),
          catchError((err) => {
            const status = err?.status ?? err?.error?.status;
            const message =
              typeof err?.error === 'string'
                ? err.error
                : err?.error?.message ?? err?.message ?? 'Unable to validate. Please check your connection and try again.';
            console.error('PlatformApiService: intake/validate failed', { url, status, message, err });
            return throwError(() => new Error(message));
          })
        )
    );
  }

  /** POST app user notification (e.g. volunteer interest) */
  postAppUserNotification(payload: {
    firstName: string;
    lastName: string;
    email: string;
    devicePlatform: string;
    deviceModel: string;
    itemType: string;
    itemId: string;
    itemTitle: string;
  }): Promise<void> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/app-user-notification`;
    console.debug('PlatformApiService: app-user-notification POST', { url, payload });
    return firstValueFrom(
      this.http.post(url, payload, { headers: this.headers }).pipe(
        tap(() => console.debug('PlatformApiService: app-user-notification OK')),
        map(() => undefined),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: app-user-notification failed', {
            url,
            payload,
            status,
            message,
            err,
          });
          throw err;
        })
      )
    );
  }
}
