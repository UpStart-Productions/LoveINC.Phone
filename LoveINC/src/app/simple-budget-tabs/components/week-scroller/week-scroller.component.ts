import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { addDays, format, startOfDay } from 'date-fns';

export interface WeekScrollerWeek {
  weekStartDate: string;
  labelShort: string;
  labelLong: string;
  isCurrentWeek: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-week-scroller',
  templateUrl: 'week-scroller.component.html',
  styleUrls: ['week-scroller.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class WeekScrollerComponent implements OnInit {
  @ViewChild('weekScroller', { static: false }) weekScroller!: ElementRef;
  @Input() initialWeekStart?: string;
  @Output() weekSelectedEvent = new EventEmitter<string>();

  weeks: WeekScrollerWeek[] = [];

  selectWeek(week: WeekScrollerWeek) {
    this.weeks.forEach((w) => (w.isSelected = false));
    week.isSelected = true;
    this.weekSelectedEvent.emit(week.weekStartDate);
  }

  private getSundayForDate(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    const day = copy.getDay();
    copy.setDate(copy.getDate() - day);
    return copy;
  }

  private calculateWeekRange() {
    const today = startOfDay(new Date());
    const thisWeekSunday = this.getSundayForDate(today);
    const thisWeekStart = format(thisWeekSunday, 'yyyy-MM-dd');

    this.weeks = [];
    const startOffset = -4;
    const endOffset = 3;

    for (let i = startOffset; i <= endOffset; i++) {
      const sunday = addDays(thisWeekSunday, i * 7);
      const weekStart = format(sunday, 'yyyy-MM-dd');
      const month = sunday.getMonth() + 1;
      const day = sunday.getDate();
      const labelShort = `${month}/${day}`;
      const weekEnd = addDays(sunday, 6);
      const labelLong = `Week ${format(sunday, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
      const isCurrent = weekStart === thisWeekStart;

      this.weeks.push({
        weekStartDate: weekStart,
        labelShort,
        labelLong,
        isCurrentWeek: isCurrent,
        isSelected: false,
      });
    }

    const toSelect = this.initialWeekStart
      ? this.weeks.find((w) => w.weekStartDate === this.initialWeekStart)
      : this.weeks.find((w) => w.isCurrentWeek);
    if (toSelect) this.selectWeek(toSelect);
    else if (this.weeks.length) this.selectWeek(this.weeks[0]);
  }

  private scrollToCurrentWeek() {
    const selected = this.weeks.find((w) => w.isSelected);
    const targetDate = selected?.weekStartDate ?? format(this.getSundayForDate(new Date()), 'yyyy-MM-dd');
    const targetIndex = this.weeks.findIndex((w) => w.weekStartDate === targetDate);
    if (targetIndex !== -1 && this.weekScroller?.nativeElement) {
      const weekElements = this.weekScroller.nativeElement.children;
      const targetElement = weekElements[targetIndex];
      const container = this.weekScroller.nativeElement;
      const containerWidth = container.clientWidth;
      const elementOffset = targetElement.offsetLeft;
      const elementWidth = targetElement.clientWidth;
      const scrollPosition = elementOffset - containerWidth / 2 + elementWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }

  ngOnInit() {
    this.calculateWeekRange();
    const selected = this.weeks.find((w) => w.isSelected);
    if (selected) this.weekSelectedEvent.emit(selected.weekStartDate);
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToCurrentWeek(), 50);
  }
}
