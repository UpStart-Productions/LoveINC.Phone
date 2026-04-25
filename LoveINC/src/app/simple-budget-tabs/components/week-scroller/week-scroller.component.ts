import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { addDays, differenceInDays, format, startOfDay } from 'date-fns';
import { joinWithAppDot } from '../../../shared/utils';

export interface WeekScrollerWeek {
  weekStartDate: string;
  labelShort: string;
  labelLong: string;
  isCurrentWeek: boolean;
  isSelected: boolean;
  balancePositive: boolean;
  balanceNegative: boolean;
}

@Component({
  selector: 'app-week-scroller',
  templateUrl: 'week-scroller.component.html',
  styleUrls: ['week-scroller.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class WeekScrollerComponent implements OnInit, OnChanges, AfterViewChecked {
  @ViewChild('weekScroller', { static: false }) weekScroller!: ElementRef;
  @Input() initialWeekStart?: string;
  @Input() earliestWeekStart?: string;
  @Input() weekBalances: Record<string, number> = {};
  @Output() weekSelectedEvent = new EventEmitter<string>();

  weeks: WeekScrollerWeek[] = [];
  private _shouldScrollToCurrent = true;

  selectWeek(week: WeekScrollerWeek, emit = true) {
    this.weeks.forEach((w) => (w.isSelected = false));
    week.isSelected = true;
    if (emit) this.weekSelectedEvent.emit(week.weekStartDate);
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

    /** Always show at least this many Sundays before the current week; extend further if saved data exists. */
    const minPastWeeks = 4;
    let dataWeeksBack = 0;
    if (this.earliestWeekStart) {
      const earliestSunday = new Date(this.earliestWeekStart + 'T00:00:00');
      dataWeeksBack = Math.max(
        0,
        Math.ceil(differenceInDays(thisWeekSunday, earliestSunday) / 7)
      );
    }
    const startOffset = -Math.max(minPastWeeks, dataWeeksBack);
    const endOffset = 3;

    this.weeks = [];

    for (let i = startOffset; i <= endOffset; i++) {
      const sunday = addDays(thisWeekSunday, i * 7);
      const weekStart = format(sunday, 'yyyy-MM-dd');
      const month = sunday.getMonth() + 1;
      const day = sunday.getDate();
      const labelShort = `${month}/${day}`;
      const weekEnd = addDays(sunday, 6);
      const labelLong = `Week ${joinWithAppDot(format(sunday, 'MMM d'), format(weekEnd, 'MMM d'))}`;
      const isCurrent = weekStart === thisWeekStart;

      const remaining = this.weekBalances[weekStart] ?? 0;
      this.weeks.push({
        weekStartDate: weekStart,
        labelShort,
        labelLong,
        isCurrentWeek: isCurrent,
        isSelected: false,
        balancePositive: remaining > 0,
        balanceNegative: remaining < 0,
      });
    }

    const initial = this._selectionOverride ?? this.initialWeekStart;
    const toSelect = initial
      ? this.weeks.find((w) => w.weekStartDate === initial)
      : this.weeks.find((w) => w.isCurrentWeek);
    if (toSelect) this.selectWeek(toSelect, false);
    else if (this.weeks.length) this.selectWeek(this.weeks[0], false);
    this._selectionOverride = undefined;
  }

  private _selectionOverride?: string;

  private scrollToCurrentWeek() {
    const currentWeekStart = format(this.getSundayForDate(new Date()), 'yyyy-MM-dd');
    const targetIndex = this.weeks.findIndex((w) => w.weekStartDate === currentWeekStart);
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['earliestWeekStart'] || changes['weekBalances']) {
      this._selectionOverride = this.weeks.find((w) => w.isSelected)?.weekStartDate;
      this.calculateWeekRange();
      if (changes['earliestWeekStart']) {
        this._shouldScrollToCurrent = true;
      }
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToCurrentWeek(), 50);
  }

  ngAfterViewChecked() {
    if (this._shouldScrollToCurrent) {
      this._shouldScrollToCurrent = false;
      setTimeout(() => this.scrollToCurrentWeek(), 0);
    }
  }
}
