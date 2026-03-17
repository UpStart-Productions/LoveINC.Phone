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

export interface DateScrollerDate {
  date: string;
  dayName: string;
  dayNumber: string;
  month: string;
  year: string;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-date-scroller',
  templateUrl: 'date-scroller.component.html',
  styleUrls: ['date-scroller.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class DateScrollerComponent implements OnInit {
  @ViewChild('dateScroller', { static: false }) dateScroller!: ElementRef;
  @Input() completedDates: string[] = [];
  @Output() dateSelectedEvent = new EventEmitter<DateScrollerDate>();
  dates: DateScrollerDate[] = [];

  selectDate(date: DateScrollerDate) {
    this.dates.forEach((d) => (d.isSelected = false));
    date.isSelected = true;
    this.dateSelectedEvent.emit(date);
  }

  private calculateDateRange() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateEnd = new Date(today);
    dateEnd.setDate(dateEnd.getDate() + 7);
    const dateStart = new Date(today);
    dateStart.setMonth(dateStart.getMonth() - 2);

    this.dates = [];
    let current = new Date(dateStart);

    while (current <= dateEnd) {
      const d = new Date(current);
      const dateStr = d.toISOString().slice(0, 10);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const isToday = dayStart.getTime() === today.getTime();
      this.dates.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'long' }),
        year: d.getFullYear().toString(),
        isToday,
        isSelected: isToday,
      });
      current.setDate(current.getDate() + 1);
    }
    this.dates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private scrollToCurrentDate() {
    const today = new Date().toISOString().slice(0, 10);
    const todayIndex = this.dates.findIndex((d) => d.date === today);
    if (todayIndex !== -1 && this.dateScroller?.nativeElement) {
      const dateElements = this.dateScroller.nativeElement.children;
      const todayElement = dateElements[todayIndex];
      const container = this.dateScroller.nativeElement;
      const containerWidth = container.clientWidth;
      const elementOffset = todayElement.offsetLeft;
      const elementWidth = todayElement.clientWidth;
      const scrollPosition = elementOffset - containerWidth / 2 + elementWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }

  ngOnInit() {
    this.calculateDateRange();
  }

  ngAfterViewInit() {
    setTimeout(() => this.scrollToCurrentDate(), 50);
  }
}
