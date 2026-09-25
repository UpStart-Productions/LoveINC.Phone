import { Component, Input, ViewChild } from '@angular/core';
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

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addYears(d: Date, years: number): Date {
  const copy = new Date(d);
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}

function dateOnlyFromIonValue(value: string): string {
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  return datePart;
}

function clampDate(dateStr: string, min: string, max: string): string {
  if (dateStr < min) {
    return min;
  }
  if (dateStr > max) {
    return max;
  }
  return dateStr;
}

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

  /** Earliest allowed date — enforced on Confirm, not on the wheel (min on ion-datetime locks months to Sept–Dec). */
  min = '';
  max = '';
  ionValue = '';
  showDatetime = true;

  /** Selected calendar date (YYYY-MM-DD). */
  selectedDate = '';

  @ViewChild(IonDatetime) datetime?: IonDatetime;

  constructor(private modalCtrl: ModalController) {}

  ionViewWillEnter() {
    const now = new Date();
    this.min = toLocalDateString(now);
    this.max = toLocalDateString(addYears(now, 10));
    const initial = clampDate(this.value?.trim() || this.min, this.min, this.max);
    this.selectedDate = initial;
    this.ionValue = initial;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async setToday() {
    this.selectedDate = this.min;
    this.ionValue = this.min;
    // Remount ion-datetime so wheel columns match Today (reset() alone is unreliable with preferWheel).
    this.showDatetime = false;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    this.showDatetime = true;
  }

  confirm() {
    const fromDatetime = this.datetime?.value;
    const raw =
      typeof fromDatetime === 'string'
        ? dateOnlyFromIonValue(fromDatetime)
        : this.selectedDate || this.min;
    this.modalCtrl.dismiss(clampDate(raw, this.min, this.max), 'confirm');
  }

  onDatetimeChange(ev: CustomEvent) {
    const v = ev.detail?.value;
    if (typeof v === 'string') {
      const next = dateOnlyFromIonValue(v);
      this.selectedDate = next;
      // Keep [value] in sync so Angular does not snap the wheels back to the open date.
      this.ionValue = next;
    }
  }
}
