import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonDatetime,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-date-picker-modal',
  templateUrl: './date-picker-modal.component.html',
  styleUrls: ['./date-picker-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonDatetime,
    IonIcon,
  ],
})
export class DatePickerModalComponent {
  /** Modal title (e.g. "Start date", "Due date") */
  @Input() title = 'Select date';
  /** Initial value in YYYY-MM-DD format */
  @Input() value = '';

  selectedValue = '';

  constructor(private modalCtrl: ModalController) {}

  ionViewWillEnter() {
    this.selectedValue = this.value || new Date().toISOString().slice(0, 10);
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  setToday() {
    this.selectedValue = new Date().toISOString().slice(0, 10);
  }

  confirm() {
    this.modalCtrl.dismiss(this.selectedValue, 'confirm');
  }

  onDatetimeChange(ev: CustomEvent) {
    const v = ev.detail?.value;
    if (typeof v === 'string') {
      this.selectedValue = v.slice(0, 10);
    }
  }
}
