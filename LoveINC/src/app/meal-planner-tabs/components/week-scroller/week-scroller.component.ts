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

export interface MealWeekScrollerWeek {
  weekStartDate: string;
  labelShort: string;
  isCurrentWeek: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-meal-week-scroller',
  templateUrl: 'week-scroller.component.html',
  styleUrls: ['week-scroller.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class MealWeekScrollerComponent implements OnInit, OnChanges, AfterViewChecked {
  @ViewChild('weekScroller', { static: false }) weekScroller!: ElementRef;
  @Input() initialWeekStart?: string;
  @Input() earliestWeekStart?: string;
  @Output() weekSelectedEvent = new EventEmitter<string>();

  weeks: MealWeekScrollerWeek[] = [];
  private _shouldScrollToCurrent = true;
  private _selectionOverride?: string;

  selectWeek(week: MealWeekScrollerWeek, emit = true) {
    this.weeks.forEach((w) => (w.isSelected = false));
    week.isSelected = true;
    if (emit) this.weekSelectedEvent.emit(week.weekStartDate);
  }

  private getSundayForDate(d: Date): Date {
    const copy = startOfDay(d);
    return addDays(copy, -copy.getDay());
  }

  private calculateWeekRange() {
    const thisWeekSunday = this.getSundayForDate(new Date());
    const thisWeekStart = format(thisWeekSunday, 'yyyy-MM-dd');
    const minPastWeeks = 4;
    let dataWeeksBack = 0;
    if (this.earliestWeekStart) {
      const earliestSunday = new Date(`${this.earliestWeekStart}T00:00:00`);
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
      const labelShort = `${sunday.getMonth() + 1}/${sunday.getDate()}`;
      this.weeks.push({
        weekStartDate: weekStart,
        labelShort,
        isCurrentWeek: weekStart === thisWeekStart,
        isSelected: false,
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

  private scrollToCurrentWeek() {
    const currentWeekStart = format(this.getSundayForDate(new Date()), 'yyyy-MM-dd');
    const targetIndex = this.weeks.findIndex((w) => w.weekStartDate === currentWeekStart);
    if (targetIndex !== -1 && this.weekScroller?.nativeElement) {
      const weekElements = this.weekScroller.nativeElement.children;
      const targetElement = weekElements[targetIndex];
      const container = this.weekScroller.nativeElement;
      const scrollPosition =
        targetElement.offsetLeft - container.clientWidth / 2 + targetElement.clientWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }

  ngOnInit() {
    this.calculateWeekRange();
    const selected = this.weeks.find((w) => w.isSelected);
    if (selected) this.weekSelectedEvent.emit(selected.weekStartDate);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['earliestWeekStart']) {
      this._selectionOverride = this.weeks.find((w) => w.isSelected)?.weekStartDate;
      this.calculateWeekRange();
      this._shouldScrollToCurrent = true;
    }
  }

  ngAfterViewChecked() {
    if (this._shouldScrollToCurrent) {
      this._shouldScrollToCurrent = false;
      setTimeout(() => this.scrollToCurrentWeek(), 0);
    }
  }
}
