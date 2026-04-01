import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  switchMap,
  map,
  from,
  catchError,
  of,
  combineLatest,
  startWith,
  timeout,
  mergeMap,
} from 'rxjs';
import { PlatformApiService, type PlatformNotification } from './platform/platform-api.service';
import { GrovLinkDatabaseService } from './grovlink-database.service';
import { DeviceIdService } from './device-id.service';
import { UserProfileService } from './user-profile.service';
import { OnboardingService } from './onboarding.service';

export interface AppNotification extends PlatformNotification {
  read: boolean;
  /** 'content' = AppNotification (broadcast); 'user' = AppUserNotification (voucher approved, etc.) */
  source?: 'content' | 'user';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  /** Notification IDs marked read this session (SQLite may lag or fail; UI must still update). */
  private readonly localReadIdsSession = new Set<string>();

  readonly notifications$: Observable<AppNotification[]> = this.refresh$.pipe(
    switchMap(() => {
      const content$ = this.platformApi.getNotifications().pipe(
        switchMap((apiNotifications) => {
          const list = apiNotifications ?? [];
          return from(this.grovlinkDb.getReadNotificationIds()).pipe(
            timeout({ first: 5_000 }),
            map((readIds) =>
              list.map((n) => ({
                ...n,
                read: this.isNotificationRead(n.id, readIds),
                source: 'content' as const,
              }))
            ),
            /** Never drop API notifications because local read-state failed, timed out, or DB is wedged */
            catchError((err) => {
              console.warn(
                'NotificationsService: read-state skipped, showing content as unread',
                err?.message ?? err
              );
              return of(
                list.map((n) => ({
                  ...n,
                  read: this.isNotificationRead(n.id, new Set<string>()),
                  source: 'content' as const,
                }))
              );
            }),
          );
        }),
        catchError((err) => {
          console.warn('NotificationsService: content notifications failed', err?.message ?? err);
          return of([]);
        })
      );

      const deviceId = this.deviceId.getDeviceId();
      const profile = this.userProfileService.getProfile();
      const onboarding = this.onboardingService.getOnboardingData();
      const email = (profile.email ?? onboarding?.email)?.trim();

      /** Profile is merged for voucher-style alerts. It must not block content (event/class/CTA/service) notifications:
       * combineLatest waits for each stream's first emission — without startWith([]), the list stays empty until
       * getAppUserProfile completes (or hangs forever if that request never returns). */
      const user$ =
        deviceId || email
          ? this.platformApi.getAppUserProfile({
              deviceId: deviceId || undefined,
              email: email || undefined,
            }).pipe(
              timeout({ first: 15_000 }),
              mergeMap((res) => {
                const list = res?.profile?.notifications ?? [];
                return from(this.grovlinkDb.getReadNotificationIds()).pipe(
                  timeout({ first: 5_000 }),
                  map((readIds) =>
                    list.map((n) => ({
                      id: n.id,
                      itemType: n.type,
                      itemId: '',
                      title: n.title,
                      body: n.body ?? '',
                      meta: (n.meta ?? {}) as PlatformNotification['meta'],
                      createdAt: n.createdAt,
                      read: !!n.readAt || this.isNotificationRead(n.id, readIds),
                      source: 'user' as const,
                    }))
                  ),
                  catchError((err) => {
                    console.warn(
                      'NotificationsService: user notification read-state skipped',
                      err?.message ?? err
                    );
                    return of(
                      list.map((n) => ({
                        id: n.id,
                        itemType: n.type,
                        itemId: '',
                        title: n.title,
                        body: n.body ?? '',
                        meta: (n.meta ?? {}) as PlatformNotification['meta'],
                        createdAt: n.createdAt,
                        read: !!n.readAt || this.isNotificationRead(n.id, new Set<string>()),
                        source: 'user' as const,
                      }))
                    );
                  })
                );
              }),
              catchError((err) => {
                console.warn('NotificationsService: profile notifications failed', err?.message ?? err);
                return of([]);
              }),
              startWith([] as AppNotification[]),
            )
          : of([]);

      return combineLatest([content$, user$]).pipe(
        map(([content, user]) => {
          const merged = [...content, ...user];
          return merged.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })
      );
    }),
    catchError((err) => {
      console.warn('NotificationsService: failed to load', err?.message ?? err);
      return of([]);
    })
  );

  readonly unreadCount$: Observable<number> = this.notifications$.pipe(
    map((list) => list.filter((n) => !n.read).length)
  );

  readonly hasUnread$: Observable<boolean> = this.unreadCount$.pipe(
    map((count) => count > 0)
  );

  constructor(
    private platformApi: PlatformApiService,
    private grovlinkDb: GrovLinkDatabaseService,
    private deviceId: DeviceIdService,
    private userProfileService: UserProfileService,
    private onboardingService: OnboardingService
  ) {}

  refresh(): void {
    this.refresh$.next();
  }

  private normalizeContentNotificationId(id: unknown): string {
    if (id === null || id === undefined) return '';
    return String(id).trim();
  }

  private isNotificationRead(apiId: unknown, readIdsFromDb: Set<string>): boolean {
    const key = this.normalizeContentNotificationId(apiId);
    if (!key) return false;
    return this.localReadIdsSession.has(key) || readIdsFromDb.has(key);
  }

  /** Mark content notification (broadcast) as read — session + SQLite. */
  async markAsRead(notificationId: string): Promise<void> {
    const key = this.normalizeContentNotificationId(notificationId);
    if (!key) return;
    this.localReadIdsSession.add(key);
    this.refresh();
    await this.persistReadNotificationId(key);
  }

  private async persistReadNotificationId(key: string): Promise<void> {
    try {
      await this.grovlinkDb.markNotificationAsRead(key);
    } catch (err) {
      console.warn('NotificationsService: persist read notification failed', err);
    }
    this.refresh();
  }

  /** Mark user notification as read — API plus local SQLite so reads survive app restarts. */
  async markUserNotificationAsRead(notificationId: string): Promise<void> {
    const key = this.normalizeContentNotificationId(notificationId);
    if (!key) return;
    this.localReadIdsSession.add(key);
    this.refresh();

    const deviceId = this.deviceId.getDeviceId();
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    if (deviceId || email) {
      try {
        await this.platformApi.markNotificationRead(notificationId, {
          deviceId: deviceId || undefined,
          email: email || undefined,
        });
      } catch (err) {
        console.warn('NotificationsService: mark user notification read failed', err);
      }
    }
    await this.persistReadNotificationId(key);
  }
}
