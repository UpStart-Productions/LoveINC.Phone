import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
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
export class WeeklyBarChartComponent implements OnChanges, AfterViewInit {
  /** One bar per day, week, or month depending on the parent screen */
  @Input() data: WeeklyBarData[] = [];
  @Input() unitNoun = 'times';

  displayValues: number[] = [];

  private currentPopover: HTMLIonPopoverElement | null = null;
  private currentBarIndex: number | null = null;
  private animateFrameId: number | null = null;

  constructor(private popoverCtrl: PopoverController) {}

  ngAfterViewInit() {
    this.animateBars();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.animateBars();
    }
  }

  private animateBars() {
    if (this.animateFrameId !== null) {
      cancelAnimationFrame(this.animateFrameId);
      this.animateFrameId = null;
    }

    const targets = this.data.map((item) => item.value);
    this.displayValues = targets.map(() => 0);

    this.animateFrameId = requestAnimationFrame(() => {
      this.animateFrameId = requestAnimationFrame(() => {
        this.displayValues = [...targets];
        this.animateFrameId = null;
      });
    });
  }

  private getBarAnchorEvent(event: Event): Event {
    const wrapper = event.currentTarget as HTMLElement;
    const anchor = wrapper.querySelector('.bar-track') ?? wrapper;
    return { target: anchor, currentTarget: anchor } as unknown as Event;
  }

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
        unitNoun: this.unitNoun,
      },
      event: this.getBarAnchorEvent(event),
      reference: 'trigger',
      side: 'bottom',
      alignment: 'center',
      arrow: true,
      size: 'auto',
      showBackdrop: true,
      backdropDismiss: true,
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
