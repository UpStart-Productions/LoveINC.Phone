import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsyncPipe } from '@angular/common';
import {
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { AlertsModalService } from '../../services/alerts-modal.service';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications-button',
  standalone: true,
  imports: [CommonModule, AsyncPipe, IonButton, IonIcon],
  styles: [`:host { display: inline-flex; }`],
  template: `
    <ion-button class="notifications-button" (click)="openAlertsModal()">
      <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
      <span *ngIf="showBadgePreview || (hasUnread$ | async)" class="notification-badge"></span>
    </ion-button>
  `,
})
export class NotificationsButtonComponent {
  /** TEMP: preview unread badge — set to false when done reviewing. */
  readonly showBadgePreview = true;

  readonly hasUnread$ = this.notificationsService.hasUnread$;

  constructor(
    private alertsModalService: AlertsModalService,
    private notificationsService: NotificationsService
  ) {}

  openAlertsModal(): void {
    this.alertsModalService.openAlertsModal();
  }
}
