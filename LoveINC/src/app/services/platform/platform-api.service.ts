import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, tap, firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  PlatformAddress,
  PlatformClass,
  PlatformCta,
  PlatformCustomer,
  PlatformDonation,
  PlatformEvent,
  PlatformHomeFeedItem,
  PlatformImpactStory,
  PlatformNotification,
  PlatformOrganization,
  PlatformPartner,
  PlatformService,
  PlatformTeamMember,
  PlatformVolunteerPositionWithAffiliate,
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
  PlatformPartner,
  PlatformService,
  PlatformTeamMember,
  PlatformVoucher,
  PlatformVolunteerPositionWithAffiliate,
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

  /**
   * Get customer-level organization. Use for Service Access messaging (customer name, not affiliate).
   * GET /public/:customerSlug/customer
   */
  getCustomer(): Observable<PlatformCustomer | null> {
    const { apiBaseUrl, apiKey, customerSlug } = environment;
    const basePath = `${apiBaseUrl.replace(/\/$/, '')}/public/${customerSlug}`;
    const url = `${basePath}/customer`;
    if (!apiKey) {
      return of(null);
    }
    return this.http
      .get<PlatformCustomer>(url, {
        headers: this.headers,
      })
      .pipe(
        tap((res) => {
          if (res != null) {
            console.debug('PlatformApiService: /customer OK', res);
          }
        }),
        catchError((err) => {
          console.warn('PlatformApiService: getCustomer failed, using organization fallback', err?.status);
          return of(null);
        })
      );
  }

  /**
   * Get client access settings (intake required). Used for voucher icon visibility.
   * GET /public/:customerSlug/:tenantSlug/client-access
   */
  getClientAccess(): Observable<{ intakeRequired: boolean }> {
    return this.get<{ intakeRequired: boolean }>('/client-access').pipe(
      map((res) => res ?? { intakeRequired: false })
    );
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

  getOrganizationPartners(): Observable<PlatformPartner[]> {
    return this.get<{ partners: PlatformPartner[] }>('/organization-partners').pipe(
      map((res) => res?.partners ?? [])
    );
  }

  /** GET /public/:customerSlug/:tenantSlug/team */
  getTeam(): Observable<PlatformTeamMember[]> {
    return this.get<{ teamMembers: PlatformTeamMember[] }>('/team').pipe(
      map((res) => res?.teamMembers ?? [])
    );
  }

  getVolunteerPositions(): Observable<PlatformVolunteerPositionWithAffiliate[]> {
    return this.get<{ volunteerPositions: PlatformVolunteerPositionWithAffiliate[] }>(
      '/volunteer-positions'
    ).pipe(map((res) => res?.volunteerPositions ?? []));
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

  /**
   * Register app user (onboarding). POST /public/:customerSlug/:tenantSlug/app-users
   */
  registerAppUser(payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    deviceId?: string;
    devicePlatform?: string;
    deviceModel?: string;
    newsletterOptIn?: boolean;
  }): Promise<{ id: string; magicLinkSent?: boolean }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/app-users`;
    const body: Record<string, string | boolean> = {};
    if (payload.firstName?.trim()) body['firstName'] = payload.firstName.trim();
    if (payload.lastName?.trim()) body['lastName'] = payload.lastName.trim();
    if (payload.email?.trim()) body['email'] = payload.email.trim().toLowerCase();
    if (payload.deviceId?.trim()) body['deviceId'] = payload.deviceId.trim();
    if (payload.devicePlatform?.trim()) body['devicePlatform'] = payload.devicePlatform.trim();
    if (payload.deviceModel?.trim()) body['deviceModel'] = payload.deviceModel.trim();
    if (payload.newsletterOptIn !== undefined) body['newsletterOptIn'] = payload.newsletterOptIn;

    return firstValueFrom(
      this.http.post<{ id: string; magicLinkSent?: boolean }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: app-users register OK', res)),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: app-users register failed', { url, status, message, err });
          throw err;
        })
      )
    );
  }

  /**
   * Submit in-app support request. POST /public/:customerSlug/:tenantSlug/support-request
   * (GrovLink — endpoint may not exist until backend ships.)
   */
  postSupportRequest(payload: {
    name: string;
    categoryIds: string[];
    details?: string;
    deviceId?: string;
    devicePlatform?: string;
    deviceModel?: string;
  }): Promise<{ id: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/support-request`;
    const name = payload.name.trim().slice(0, 500);
    const body: Record<string, unknown> = {
      name,
      categoryIds: payload.categoryIds,
    };
    if (payload.details?.trim()) {
      body['details'] = payload.details.trim().slice(0, 20000);
    }
    if (payload.deviceId?.trim()) body['deviceId'] = payload.deviceId.trim().slice(0, 128);
    if (payload.devicePlatform?.trim()) {
      body['devicePlatform'] = payload.devicePlatform.trim().slice(0, 120);
    }
    if (payload.deviceModel?.trim()) {
      body['deviceModel'] = payload.deviceModel.trim().slice(0, 512);
    }

    return firstValueFrom(
      this.http.post<{ id: string }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: support-request OK', res)),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: support-request failed', { url, status, message, err });
          throw err;
        })
      )
    );
  }

  /**
   * Submit pre-intake (I need assistance form). POST /public/:customerSlug/:tenantSlug/pre-intake
   */
  postPreIntake(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city: string;
    reason: string;
    comments?: string;
    deviceId?: string;
    newsletterOptIn?: boolean;
    textOptIn?: boolean;
  }): Promise<{ id: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/pre-intake`;
    const body: Record<string, unknown> = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      city: payload.city.trim(),
      reason: payload.reason.trim(),
      newsletterOptIn: payload.newsletterOptIn ?? false,
      textOptIn: payload.textOptIn ?? false,
    };
    if (payload.phone?.trim()) body['phone'] = payload.phone.trim();
    if (payload.comments?.trim()) body['comments'] = payload.comments.trim();
    if (payload.deviceId?.trim()) body['deviceId'] = payload.deviceId.trim();

    return firstValueFrom(
      this.http.post<{ id: string }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: pre-intake OK', res)),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: pre-intake failed', { url, status, message, err });
          throw err;
        })
      )
    );
  }

  /**
   * Submit class registration. POST /public/:customerSlug/:tenantSlug/class-registration
   */
  postClassRegistration(payload: {
    classId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mailingAddress: string;
    birthDate: string;
    answers?: Record<string, string | number | boolean>;
    deviceId?: string;
  }): Promise<{ id: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/class-registration`;
    const body: Record<string, unknown> = {
      classId: payload.classId.trim(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      mailingAddress: payload.mailingAddress.trim(),
      birthDate: payload.birthDate.trim(),
    };
    if (payload.answers && Object.keys(payload.answers).length > 0) {
      body['answers'] = payload.answers;
    }
    if (payload.deviceId?.trim()) body['deviceId'] = payload.deviceId.trim();

    return firstValueFrom(
      this.http.post<{ id: string }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: class-registration OK', res)),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: class-registration failed', { url, status, message, err });
          throw err;
        })
      )
    );
  }

  /**
   * Get full app user profile (voucher requests, notifications). GET app-user/profile
   */
  getAppUserProfile(params: { deviceId?: string; email?: string }): Observable<{
    profile: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      emailVerifiedAt: string | null;
      activities: { activityType: string; itemType: string | null; itemId: string | null }[];
      intakeCompleted: boolean;
      voucherRequests: {
        id: string;
        voucherId: string;
        voucherTitle: string;
        shortDescription?: string | null;
        photoUrl?: string | null;
        status: string;
        approvedAt: string | null;
        deniedAt: string | null;
        redeemedAt: string | null;
        expiresAt: string | null;
        createdAt: string;
        providerOffering?: string | null;
        location?: { address: string; locationName: string | null; city: string; state: string; zip: string } | null;
      }[];
      volunteerRequests: {
        id: string;
        itemType: string;
        itemId: string;
        itemTitle: string | null;
        status: string;
        approvedAt: string | null;
        deniedAt: string | null;
        completedAt: string | null;
        createdAt: string;
      }[];
      notifications: {
        id: string;
        type: string;
        title: string;
        body: string | null;
        meta: unknown;
        readAt: string | null;
        createdAt: string;
      }[];
    } | null;
  }> {
    const q = new URLSearchParams();
    if (params.deviceId?.trim()) q.set('deviceId', params.deviceId.trim());
    if (params.email?.trim()) q.set('email', params.email.trim().toLowerCase());
    const query = q.toString();
    const path = `/app-user/profile${query ? `?${query}` : ''}`;
    type ProfileResponse = {
      profile: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        emailVerifiedAt: string | null;
        activities: { activityType: string; itemType: string | null; itemId: string | null }[];
        intakeCompleted: boolean;
        voucherRequests: {
          id: string;
          voucherId: string;
          voucherTitle: string;
          shortDescription?: string | null;
          photoUrl?: string | null;
          status: string;
          approvedAt: string | null;
          deniedAt: string | null;
          redeemedAt: string | null;
          expiresAt: string | null;
          createdAt: string;
          providerOffering?: string | null;
          location?: { address: string; locationName: string | null; city: string; state: string; zip: string } | null;
        }[];
        volunteerRequests: {
          id: string;
          itemType: string;
          itemId: string;
          itemTitle: string | null;
          status: string;
          approvedAt: string | null;
          deniedAt: string | null;
          completedAt: string | null;
          createdAt: string;
        }[];
        notifications: {
          id: string;
          type: string;
          title: string;
          body: string | null;
          meta: unknown;
          readAt: string | null;
          createdAt: string;
        }[];
      } | null;
    };
    return this.get<ProfileResponse>(path).pipe(
      map((res): ProfileResponse => (res != null ? res : { profile: null }))
    );
  }

  /**
   * Send magic link (verify or restore). POST magic-link/send
   */
  sendMagicLink(params: {
    purpose: 'verify' | 'restore';
    email: string;
    deviceId?: string;
  }): Promise<{ sent: boolean; error?: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/magic-link/send`;
    const body: Record<string, string> = {
      purpose: params.purpose,
      email: params.email.trim().toLowerCase(),
    };
    if (params.deviceId?.trim()) body['deviceId'] = params.deviceId.trim();

    return firstValueFrom(
      this.http.post<{ sent: boolean; error?: string }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: magic-link/send OK', res)),
        catchError((err) => {
          const message = err?.error?.error ?? err?.message ?? 'Failed to send';
          return throwError(() => new Error(message));
        })
      )
    );
  }

  /**
   * Send change-email magic link. POST magic-link/change-email
   */
  sendChangeEmailMagicLink(params: {
    newEmail: string;
    deviceId?: string;
    email?: string;
  }): Promise<{ sent: boolean; error?: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/magic-link/change-email`;
    const body: Record<string, string> = {
      newEmail: params.newEmail.trim().toLowerCase(),
    };
    if (params.deviceId?.trim()) body['deviceId'] = params.deviceId.trim();
    if (params.email?.trim()) body['email'] = params.email.trim().toLowerCase();

    return firstValueFrom(
      this.http.post<{ sent: boolean; error?: string }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: magic-link/change-email OK', res)),
        catchError((err) => {
          const message = err?.error?.error ?? err?.message ?? 'Failed to send';
          return throwError(() => new Error(message));
        })
      )
    );
  }

  /**
   * Mark app user notification as read. PATCH app-user/notifications/:id/read
   */
  markNotificationRead(
    notificationId: string,
    params: { deviceId?: string; email?: string }
  ): Promise<{ ok: boolean }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const q = new URLSearchParams();
    if (params.deviceId?.trim()) q.set('deviceId', params.deviceId.trim());
    if (params.email?.trim()) q.set('email', params.email.trim().toLowerCase());
    const query = q.toString();
    const url = `${this.basePath}/app-user/notifications/${encodeURIComponent(notificationId)}/read${query ? `?${query}` : ''}`;
    return firstValueFrom(
      this.http.patch<{ ok: boolean }>(url, {}, { headers: this.headers }).pipe(
        tap(() => console.debug('PlatformApiService: mark notification read OK')),
        catchError((err) => {
          console.error('PlatformApiService: mark notification read failed', err);
          return of({ ok: false });
        })
      )
    );
  }

  /**
   * Verify magic link token (when app opens via deep link). GET public-magic-link/verify?token=xxx
   * No API key required.
   */
  verifyMagicLink(token: string): Promise<{
    ok: boolean;
    appUserId?: string;
    email?: string;
    customerSlug?: string;
    tenantSlug?: string;
    firstName?: string | null;
    lastName?: string | null;
  }> {
    const { apiBaseUrl } = environment;
    const base = apiBaseUrl.replace(/\/$/, '');
    const url = `${base}/public-magic-link/verify?token=${encodeURIComponent(token)}`;
    return firstValueFrom(
      this.http
        .get<{ ok: boolean; appUserId?: string; email?: string; customerSlug?: string; tenantSlug?: string; firstName?: string | null; lastName?: string | null }>(url, {
          headers: new HttpHeaders({ Accept: 'application/json' }),
        })
        .pipe(
          tap((res) => console.debug('PlatformApiService: magic-link/verify OK', res)),
          catchError((err) => {
            const message = err?.error?.error ?? err?.message ?? 'Verification failed';
            return throwError(() => new Error(message));
          })
        )
    );
  }

  /**
   * Get app user data (for UI config on load). GET /public/:customerSlug/:tenantSlug/app-user
   * Pass deviceId and/or email as query params.
   */
  getAppUser(params: { deviceId?: string; email?: string }): Observable<{
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      emailVerifiedAt: string | null;
      activities: { activityType: string; itemType: string | null; itemId: string | null }[];
      intakeCompleted: boolean;
    } | null;
  }> {
    const q = new URLSearchParams();
    if (params.deviceId?.trim()) q.set('deviceId', params.deviceId.trim());
    if (params.email?.trim()) q.set('email', params.email.trim().toLowerCase());
    const query = q.toString();
    const path = `/app-user${query ? `?${query}` : ''}`;
    type AppUserResponse = {
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        emailVerifiedAt: string | null;
        activities: { activityType: string; itemType: string | null; itemId: string | null }[];
        intakeCompleted: boolean;
      } | null;
    };
    return this.get<AppUserResponse>(path).pipe(
      map((res): AppUserResponse => (res != null ? res : { user: null }))
    );
  }

  /**
   * Request a voucher. POST /public/:customerSlug/:tenantSlug/voucher-request
   */
  postVoucherRequest(payload: {
    voucherId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    deviceId?: string;
    devicePlatform?: string;
    deviceModel?: string;
  }): Promise<{ id: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const url = `${this.basePath}/voucher-request`;
    const body: Record<string, string> = {
      voucherId: payload.voucherId.trim(),
    };
    if (payload.email?.trim()) body['email'] = payload.email.trim().toLowerCase();
    if (payload.firstName?.trim()) body['firstName'] = payload.firstName.trim();
    if (payload.lastName?.trim()) body['lastName'] = payload.lastName.trim();
    if (payload.deviceId?.trim()) body['deviceId'] = payload.deviceId.trim();
    if (payload.devicePlatform?.trim()) body['devicePlatform'] = payload.devicePlatform.trim();
    if (payload.deviceModel?.trim()) body['deviceModel'] = payload.deviceModel.trim();

    return firstValueFrom(
      this.http.post<{ id: string }>(url, body, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: voucher-request OK', res)),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: voucher-request failed', { url, status, message, err });
          return throwError(() => new Error(message));
        })
      )
    );
  }

  /**
   * Redeem a voucher. POST /public/:customerSlug/:tenantSlug/voucher-request/:id/redeem
   * Requires deviceId or email in query params (same auth as profile).
   */
  redeemVoucher(
    voucherRequestId: string,
    params: { deviceId?: string; email?: string }
  ): Promise<{ ok: boolean }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const q = new URLSearchParams();
    if (params.deviceId?.trim()) q.set('deviceId', params.deviceId.trim());
    if (params.email?.trim()) q.set('email', params.email.trim().toLowerCase());
    const query = q.toString();
    const url = `${this.basePath}/voucher-request/${voucherRequestId}/redeem${query ? `?${query}` : ''}`;
    return firstValueFrom(
      this.http.post<{ ok: boolean }>(url, {}, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: voucher redeem OK', res)),
        catchError((err) => {
          const status = err?.status ?? err?.error?.status;
          const message = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error);
          console.error('PlatformApiService: voucher redeem failed', { url, status, message, err });
          return throwError(() => new Error(message));
        })
      )
    );
  }

  /**
   * Mark volunteer request complete. PATCH volunteer-requests/:id/complete
   */
  markVolunteerRequestComplete(
    volunteerRequestId: string,
    params: { deviceId?: string; email?: string }
  ): Promise<{ ok: boolean; error?: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const q = new URLSearchParams();
    if (params.deviceId?.trim()) q.set('deviceId', params.deviceId.trim());
    if (params.email?.trim()) q.set('email', params.email.trim().toLowerCase());
    const query = q.toString();
    const url = `${this.basePath}/volunteer-requests/${encodeURIComponent(volunteerRequestId)}/complete${query ? `?${query}` : ''}`;
    return firstValueFrom(
      this.http.patch<{ ok: boolean; error?: string }>(url, {}, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: volunteer-request complete OK', res)),
        catchError((err) => {
          const message = err?.error?.error ?? err?.message ?? 'Failed to mark complete';
          return throwError(() => new Error(message));
        })
      )
    );
  }

  /**
   * Delete volunteer request. DELETE volunteer-requests/:id
   */
  deleteVolunteerRequest(
    volunteerRequestId: string,
    params: { deviceId?: string; email?: string }
  ): Promise<{ ok: boolean; error?: string }> {
    if (!environment.apiKey) {
      return Promise.reject(new Error('API key not configured'));
    }
    const q = new URLSearchParams();
    if (params.deviceId?.trim()) q.set('deviceId', params.deviceId.trim());
    if (params.email?.trim()) q.set('email', params.email.trim().toLowerCase());
    const query = q.toString();
    const url = `${this.basePath}/volunteer-requests/${encodeURIComponent(volunteerRequestId)}${query ? `?${query}` : ''}`;
    return firstValueFrom(
      this.http.delete<{ ok: boolean; error?: string }>(url, { headers: this.headers }).pipe(
        tap((res) => console.debug('PlatformApiService: volunteer-request delete OK', res)),
        catchError((err) => {
          const message = err?.error?.error ?? err?.message ?? 'Failed to delete';
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
    deviceId?: string;
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
