import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AlertsModalComponent } from '../components/alerts-modal/alerts-modal.component';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root',
})
export class AlertsModalService {
  private isOpen = false;
  constructor(
    private modalController: ModalController,
    private notificationsService: NotificationsService
  ) {}

  async openAlertsModal(): Promise<void> {
    if (this.isOpen) return;
    this.isOpen = true;
    try {
      this.notificationsService.refresh();
      const modal = await this.modalController.create({
        component: AlertsModalComponent,
        cssClass: 'alerts-modal-sheet',
        breakpoints: [0, 1],
        initialBreakpoint: 1,
        handle: false,
        showBackdrop: true,
        backdropDismiss: true,
      });
      await modal.present();
      await modal.onDidDismiss();
    } finally {
      this.isOpen = false;
    }
  }
}
