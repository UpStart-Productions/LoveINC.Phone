import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsService, type AppNotification } from '../../services/notifications.service';
import {
  getNotificationRoute,
  type NotificationMeta,
} from '../../shared/utils/notification-deeplink';
import { navigateAppForward } from '../../shared/utils/navigation-forward.util';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
} from '@ionic/angular/standalone';

/** TEMP: show read + unread in the notifications panel. Revert before release. */
const SHOW_ALL_NOTIFICATIONS_IN_PANEL = true;

@Component({
  selector: 'app-alerts-modal',
  templateUrl: './alerts-modal.component.html',
  styleUrls: ['./alerts-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonBadge,
  ],
})
export class AlertsModalComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private modalController: ModalController,
    private router: Router,
    private navController: NavController,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.notificationsService.refresh();
    this.notificationsService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.notifications = list
            .filter((n) => SHOW_ALL_NOTIFICATIONS_IN_PANEL || !n.read)
            .sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          this.loading = false;
        },
        error: () => {
          this.notifications = [];
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.modalController.dismiss();
  }

  async onRefresh(event: Event): Promise<void> {
    const refresher = (event as CustomEvent).target as HTMLIonRefresherElement;
    this.notificationsService.refresh();
    refresher?.complete?.();
  }

  /** Unread and created in the last 7 days (rolling window). */
  isNewNotification(n: AppNotification): boolean {
    if (SHOW_ALL_NOTIFICATIONS_IN_PANEL) return true;
    if (n.read) return false;
    const created = new Date(n.createdAt).getTime();
    if (Number.isNaN(created)) return false;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return created >= Date.now() - weekMs;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();

    if (diffMs < 60000) {
      return 'Now';
    }

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${diffHours} hr`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
    }
  }

  async onNotificationTap(notification: AppNotification): Promise<void> {
    // User notifications (e.g. voucher approved) — dismiss, mark read, go to profile
    if (notification.source === 'user') {
      if (!notification.read) {
        await this.notificationsService.markUserNotificationAsRead(notification.id);
      }
      await this.modalController.dismiss();
      await navigateAppForward(this.navController, this.router, ['/tabs/profile']);
      return;
    }

    // Content: prefer meta, fall back to top-level itemType/itemId (API sends both)
    const m = notification.meta as NotificationMeta | undefined;
    const metaType = (m?.itemType ?? notification.itemType ?? '').trim();
    const metaId = (m?.itemId?.trim() || notification.itemId?.trim() || '').trim();
    const effectiveMeta: NotificationMeta = {
      itemType: metaType,
      itemId: metaId,
      tenantSlug: m?.tenantSlug,
      ctaType: m?.ctaType,
    };
    const route = getNotificationRoute(effectiveMeta);

    if (!route) {
      return;
    }

    if (!notification.read) {
      await this.notificationsService.markAsRead(String(notification.id));
    }
    await this.modalController.dismiss();
    await navigateAppForward(this.navController, this.router, route);
  }
}
