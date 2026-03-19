import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverController } from '@ionic/angular/standalone';
import { ChartBarPopoverComponent } from '../chart-bar-popover/chart-bar-popover.component';

export interface WeeklyBarData {
  /** Date label (e.g. "3/15") */
  label: string;
  /** Progress 0–100 */
  value: number;
  /** Habits completed that day (for popover) */
  completed?: number;
  /** Habits scheduled that day (for popover) */
  scheduled?: number;
}

@Component({
  selector: 'app-weekly-bar-chart',
  templateUrl: './weekly-bar-chart.component.html',
  styleUrls: ['./weekly-bar-chart.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class WeeklyBarChartComponent {
  /** Array of 7 items, one per day */
  @Input() data: WeeklyBarData[] = [];

  private currentPopover: HTMLIonPopoverElement | null = null;
  private currentBarIndex: number | null = null;

  constructor(private popoverCtrl: PopoverController) {}

  async onBarTap(event: Event, item: WeeklyBarData, index: number) {
    if (this.currentPopover && this.currentBarIndex === index) {
      await this.currentPopover.dismiss();
      this.currentPopover = null;
      this.currentBarIndex = null;
      return;
    }
    if (this.currentPopover) {
      await this.currentPopover.dismiss();
      this.currentPopover = null;
    }
    const completed = item.completed ?? 0;
    const scheduled = item.scheduled ?? 0;
    const popover = await this.popoverCtrl.create({
      component: ChartBarPopoverComponent,
      componentProps: {
        label: item.label,
        completed,
        scheduled,
      },
      event,
      size: 'auto',
      showBackdrop: false,
      cssClass: 'chart-bar-popover',
    });
    popover.onDidDismiss().then(() => {
      this.currentPopover = null;
      this.currentBarIndex = null;
    });
    this.currentPopover = popover;
    this.currentBarIndex = index;
    await popover.present();
  }
}
