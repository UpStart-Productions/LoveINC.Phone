import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorCalendar,
  CalendarPermissionScope,
} from '@ebarooni/capacitor-calendar';
import { ToastController } from '@ionic/angular/standalone';

export interface AddToCalendarOptions {
  title: string;
  description?: string;
  location?: string;
  /** Start date as ISO string or Unix timestamp in milliseconds */
  startDate: string | number;
  /** End date as ISO string or Unix timestamp in milliseconds. If omitted, defaults to start + 1 hour. */
  endDate?: string | number;
  /** When true, opens native calendar UI so user can edit before saving. Use when dates are uncertain (e.g. gap ministry). */
  withPrompt?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private toastController: ToastController) {}

  /**
   * Add an event to the device calendar. Only works on native (iOS/Android).
   * On web, shows a toast that the feature requires the app.
   */
  async addToCalendar(options: AddToCalendarOptions): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      await this.showToast(
        'Add to Calendar is available in the Love INC app on your device.'
      );
      return false;
    }

    try {
      const { result } = await CapacitorCalendar.requestPermission({
        scope: CalendarPermissionScope.WRITE_CALENDAR,
      });

      if (result !== 'granted') {
        await this.showToast(
          'Calendar access was denied. You can enable it in Settings.',
          'danger'
        );
        return false;
      }

      const startMs = this.toTimestamp(options.startDate);
      const endMs = options.endDate
        ? this.toTimestamp(options.endDate)
        : startMs + 60 * 60 * 1000; // default 1 hour

      if (options.withPrompt) {
        await CapacitorCalendar.createEventWithPrompt({
          title: options.title,
          description: options.description ?? undefined,
          location: options.location ?? undefined,
          startDate: startMs,
          endDate: endMs,
          isAllDay: false,
          alerts: [-15, -60], // 15 min and 1 hour before
        });
      } else {
        await CapacitorCalendar.createEvent({
          title: options.title,
          description: options.description ?? undefined,
          location: options.location ?? undefined,
          startDate: startMs,
          endDate: endMs,
          isAllDay: false,
          alerts: [-15, -60],
        });
      }

      await this.showToast('Event added to your calendar', 'success');
      return true;
    } catch (err) {
      console.error('Calendar add failed:', err);
      await this.showToast(
        err instanceof Error ? err.message : 'Could not add to calendar',
        'danger'
      );
      return false;
    }
  }

  private toTimestamp(value: string | number): number {
    if (typeof value === 'number') return value;
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) throw new Error('Invalid date');
    return ms;
  }

  private async showToast(message: string, color?: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      ...(color && {
        color,
        icon: color === 'success' ? 'checkmark-circle' : 'alert-circle',
      }),
    });
    await toast.present();
  }
}
