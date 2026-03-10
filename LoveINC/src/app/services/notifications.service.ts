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

  readonly notifications$: Observable<AppNotification[]> = this.refresh$.pipe(
    switchMap(() => {
      const content$ = this.platformApi.getNotifications().pipe(
        switchMap((apiNotifications) =>
          from(this.grovlinkDb.getReadNotificationIds()).pipe(
            map((readIds) =>
              (apiNotifications ?? []).map((n) => ({
                ...n,
                read: readIds.has(n.id),
                source: 'content' as const,
              }))
            )
          )
        ),
        catchError((err) => {
          console.warn('NotificationsService: content notifications failed', err?.message ?? err);
          return of([]);
        })
      );

      const deviceId = this.deviceId.getDeviceId();
      const profile = this.userProfileService.getProfile();
      const onboarding = this.onboardingService.getOnboardingData();
      const email = (profile.email ?? onboarding?.email)?.trim();

      const user$ =
        deviceId || email
          ? this.platformApi.getAppUserProfile({
              deviceId: deviceId || undefined,
              email: email || undefined,
            }).pipe(
              map((res) => {
                const list = res?.profile?.notifications ?? [];
                return list.map((n) => ({
                  id: n.id,
                  itemType: n.type,
                  itemId: '',
                  title: n.title,
                  body: n.body ?? '',
                  meta: (n.meta ?? {}) as PlatformNotification['meta'],
                  createdAt: n.createdAt,
                  read: !!n.readAt,
                  source: 'user' as const,
                }));
              }),
              catchError((err) => {
                console.warn('NotificationsService: profile notifications failed', err?.message ?? err);
                return of([]);
              })
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

  /** Mark content notification (AppNotification) as read — uses local DB */
  async markAsRead(notificationId: string): Promise<void> {
    await this.grovlinkDb.markNotificationAsRead(notificationId);
    this.refresh();
  }

  /** Mark user notification (AppUserNotification) as read — uses API */
  async markUserNotificationAsRead(notificationId: string): Promise<void> {
    const deviceId = this.deviceId.getDeviceId();
    const profile = this.userProfileService.getProfile();
    const onboarding = this.onboardingService.getOnboardingData();
    const email = (profile.email ?? onboarding?.email)?.trim();
    if (!deviceId && !email) return;
    try {
      await this.platformApi.markNotificationRead(notificationId, {
        deviceId: deviceId || undefined,
        email: email || undefined,
      });
    } catch (err) {
      console.warn('NotificationsService: mark user notification read failed', err);
    }
    this.refresh();
  }
}
