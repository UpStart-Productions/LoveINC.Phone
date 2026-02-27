import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export interface VolunteerPosition {
  id: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  schedule?: string;
}

@Component({
  selector: 'app-volunteer-modal',
  templateUrl: './volunteer-modal.component.html',
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
    SafeHtmlPipe,
  ],
})
export class VolunteerModalComponent {
  @Input() organization = '';
  @Input() locationHours: string | null = null;
  @Input() positions: VolunteerPosition[] = [];

  constructor(private modalController: ModalController) {}

  async dismiss() {
    await this.modalController.dismiss();
  }

  async onVolunteer(position: VolunteerPosition) {
    // TODO: Navigate to volunteer flow or contact
    await this.modalController.dismiss({ position });
  }
}
