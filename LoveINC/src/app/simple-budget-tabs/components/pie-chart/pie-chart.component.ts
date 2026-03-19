import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverController } from '@ionic/angular/standalone';
import { PieSlicePopoverComponent } from '../pie-slice-popover/pie-slice-popover.component';

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class PieChartComponent implements OnChanges, OnDestroy {
  @Input() slices: PieSlice[] = [];
  @Input() size = 200;
  @Input() fill = false;
  @Input() donut = false;
  @Input() animateTrigger = 0;

  animating = false;

  private currentPopover: HTMLIonPopoverElement | null = null;
  private currentSliceIndex: number | null = null;
  private autoDismissTimer: number | null = null;

  constructor(private popoverCtrl: PopoverController) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['slices'] || changes['animateTrigger']) {
      if (this.currentPopover) {
        await this.currentPopover.dismiss();
        this.currentPopover = null;
        this.currentSliceIndex = null;
      }
      this.animating = true;
      setTimeout(() => (this.animating = false), 800);
    }
  }

  ngOnDestroy() {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    if (this.currentPopover) {
      this.currentPopover.dismiss();
      this.currentPopover = null;
      this.currentSliceIndex = null;
    }
  }

  get paths(): { d: string; color: string; label: string; value: number; index: number }[] {
    const total = this.slices.reduce((s, x) => s + x.value, 0);
    if (total <= 0) return [];

    const cx = 50;
    const cy = 50;
    const ro = 45;
    const ri = this.donut ? 28 : 0;
    const gapAngle = this.donut ? 1 : 0;
    let startAngle = -90;

    return this.slices
      .filter((s) => s.value > 0)
      .map((slice, index) => {
        const angle = (slice.value / total) * 360;
        const endAngle = startAngle + angle;
        const sliceStart = startAngle + gapAngle / 2;
        const sliceEnd = endAngle - gapAngle / 2;
        const drawAngle = Math.max(0, sliceEnd - sliceStart);
        const startRad = (sliceStart * Math.PI) / 180;
        const endRad = (sliceEnd * Math.PI) / 180;
        const largeArc = drawAngle > 180 ? 1 : 0;

        let d: string;
        if (this.donut && drawAngle > 0) {
          const ix1 = cx + ri * Math.cos(startRad);
          const iy1 = cy + ri * Math.sin(startRad);
          const ix2 = cx + ri * Math.cos(endRad);
          const iy2 = cy + ri * Math.sin(endRad);
          const ox1 = cx + ro * Math.cos(startRad);
          const oy1 = cy + ro * Math.sin(startRad);
          const ox2 = cx + ro * Math.cos(endRad);
          const oy2 = cy + ro * Math.sin(endRad);
          d = `M ${ix1} ${iy1} A ${ri} ${ri} 0 ${largeArc} 1 ${ix2} ${iy2} L ${ox2} ${oy2} A ${ro} ${ro} 0 ${largeArc} 0 ${ox1} ${oy1} Z`;
        } else if (!this.donut) {
          const x1 = cx + ro * Math.cos(startRad);
          const y1 = cy + ro * Math.sin(startRad);
          const x2 = cx + ro * Math.cos(endRad);
          const y2 = cy + ro * Math.sin(endRad);
          d = `M ${cx} ${cy} L ${x1} ${y1} A ${ro} ${ro} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        } else {
          d = '';
        }
        startAngle = endAngle;
        return { d, color: slice.color, label: slice.label, value: slice.value, index };
      })
      .filter((p) => p.d);
  }

  async onSliceTap(event: Event, item: { d: string; color: string; label: string; value: number; index: number }) {
    if (this.currentPopover && this.currentSliceIndex === item.index) {
      await this.currentPopover.dismiss();
      this.currentPopover = null;
      this.currentSliceIndex = null;
      return;
    }
    if (this.currentPopover) {
      await this.currentPopover.dismiss();
      this.currentPopover = null;
    }
    const ev = event as TouchEvent & MouseEvent;
    const clientX = ev.clientX ?? ev.changedTouches?.[0]?.clientX ?? ev.touches?.[0]?.clientX;
    const clientY = ev.clientY ?? ev.changedTouches?.[0]?.clientY ?? ev.touches?.[0]?.clientY;
    const eventWithCoords =
      clientX != null && clientY != null
        ? ({ clientX, clientY, target: event.target } as unknown as Event)
        : event;
    const popover = await this.popoverCtrl.create({
      component: PieSlicePopoverComponent,
      componentProps: {
        label: item.label,
        value: item.value,
      },
      event: eventWithCoords,
      reference: 'event',
      size: 'auto',
      showBackdrop: true,
      backdropDismiss: true,
      cssClass: 'chart-pie-popover',
    });
    popover.onDidDismiss().then(() => {
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
      this.currentPopover = null;
      this.currentSliceIndex = null;
    });
    this.currentPopover = popover;
    this.currentSliceIndex = item.index;
    await popover.present();

    this.autoDismissTimer = window.setTimeout(() => {
      if (this.currentPopover) {
        this.currentPopover.dismiss();
      }
      this.autoDismissTimer = null;
    }, 3000);
  }
}
