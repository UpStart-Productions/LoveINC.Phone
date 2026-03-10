import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import type { Voucher } from '@upstart-productions/service-unlock/src/lib/types/service-unlock.types';

@Component({
  selector: 'app-voucher-detail-modal',
  templateUrl: './voucher-detail-modal.component.html',
  styleUrls: ['./voucher-detail-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
  ],
})
export class VoucherDetailModalComponent {
  @Input() voucher!: Voucher;

  constructor(private modalController: ModalController) {}

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  close(): void {
    this.modalController.dismiss();
  }
}
