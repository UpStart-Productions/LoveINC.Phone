import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AlertsModalComponent } from '../components/alerts-modal/alerts-modal.component';

@Injectable({
  providedIn: 'root',
})
export class AlertsModalService {
  constructor(private modalController: ModalController) {}

  async openAlertsModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: AlertsModalComponent,
      cssClass: 'alerts-modal-fullscreen',
    });
    await modal.present();
  }
}
