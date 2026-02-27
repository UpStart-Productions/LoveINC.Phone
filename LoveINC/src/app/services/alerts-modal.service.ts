import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AlertsModalComponent } from '../components/alerts-modal/alerts-modal.component';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root',
})
export class AlertsModalService {
  constructor(
    private modalController: ModalController,
    private notificationsService: NotificationsService
  ) {}

  async openAlertsModal(): Promise<void> {
    this.notificationsService.refresh();
    const modal = await this.modalController.create({
      component: AlertsModalComponent,
      cssClass: 'alerts-modal-sheet',
      presentingElement: await this.modalController.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
    });
    await modal.present();
  }
}
