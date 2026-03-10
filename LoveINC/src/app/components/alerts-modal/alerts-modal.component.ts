import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsService, type AppNotification } from '../../services/notifications.service';
import { mapNotificationMetaToContentType } from '../../utils/notification-deeplink';
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
} from '@ionic/angular/standalone';

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
  ],
})
export class AlertsModalComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private modalController: ModalController,
    private router: Router,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.notificationsService.refresh();
    this.notificationsService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.notifications = list
            .filter((n) => !n.read)
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
    // Optimistically remove from list so it disappears immediately
    this.notifications = this.notifications.filter((n) => n.id !== notification.id);

    if (!notification.read) {
      if (notification.source === 'user') {
        await this.notificationsService.markUserNotificationAsRead(notification.id);
      } else {
        await this.notificationsService.markAsRead(notification.id);
      }
    }

    // User notifications (e.g. voucher approved) — dismiss and optionally go to profile
    if (notification.source === 'user') {
      await this.modalController.dismiss();
      this.router.navigate(['/tabs/profile']);
      return;
    }

    // Content notifications — deep link to event, class, CTA, service
    const { meta } = notification;
    const routeType = mapNotificationMetaToContentType(meta);
    if (routeType && meta?.itemId) {
      await this.modalController.dismiss();
      this.router.navigate(['/tabs/content-detail', routeType, meta.itemId]);
    }
  }
}
