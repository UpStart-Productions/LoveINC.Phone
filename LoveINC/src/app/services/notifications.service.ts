import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, map, from, catchError, of } from 'rxjs';
import { PlatformApiService, type PlatformNotification } from './platform/platform-api.service';
import { GrovLinkDatabaseService } from './grovlink-database.service';

export interface AppNotification extends PlatformNotification {
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  readonly notifications$: Observable<AppNotification[]> = this.refresh$.pipe(
    switchMap(() =>
      this.platformApi.getNotifications().pipe(
        switchMap((apiNotifications) =>
          from(this.grovlinkDb.getReadNotificationIds()).pipe(
            map((readIds) =>
              (apiNotifications ?? []).map((n) => ({
                ...n,
                read: readIds.has(n.id),
              }))
            )
          )
        )
      )
    ),
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
    private grovlinkDb: GrovLinkDatabaseService
  ) {}

  refresh(): void {
    this.refresh$.next();
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.grovlinkDb.markNotificationAsRead(notificationId);
    this.refresh();
  }
}
