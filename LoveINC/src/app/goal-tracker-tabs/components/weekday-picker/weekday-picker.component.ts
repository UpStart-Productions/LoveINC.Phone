import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WeekdayOption {
  day: string;
  selected: boolean;
}

@Component({
  selector: 'app-weekday-picker',
  templateUrl: 'weekday-picker.component.html',
  styleUrls: ['weekday-picker.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class WeekdayPickerComponent {
  @Input() label = 'Pick some weekdays';
  @Input() weekdayOptions: Record<string, string> = {
    Sunday: 'S',
    Monday: 'M',
    Tuesday: 'T',
    Wednesday: 'W',
    Thursday: 'T',
    Friday: 'F',
    Saturday: 'S',
  };
  @Input() selectedWeekdays: WeekdayOption[] | null = null;
  @Output() weekdaysSelectedEvent = new EventEmitter<WeekdayOption[]>();
  @Output() dirtyControlEvent = new EventEmitter<boolean>();

  returnZero() {
    return 0;
  }

  toggleSelectedDay(day: { key: string }) {
    const w = this.selectedWeekdays!.find((x) => x.day === day.key);
    if (w) {
      w.selected = !w.selected;
      this.weekdaysSelectedEvent.emit(this.selectedWeekdays!);
      this.dirtyControlEvent.emit(true);
    }
  }

  selectEveryDay() {
    this.selectedWeekdays!.forEach((d) => (d.selected = true));
    this.weekdaysSelectedEvent.emit(this.selectedWeekdays!);
    this.dirtyControlEvent.emit(true);
  }

  isEveryDaySelected(): boolean {
    return this.selectedWeekdays?.every((d) => d.selected) ?? false;
  }

  isDaySelected(dayKey: string): boolean {
    return this.selectedWeekdays?.find((x) => x.day === dayKey)?.selected ?? false;
  }

  ngOnInit() {
    if (!this.selectedWeekdays || this.selectedWeekdays.length === 0) {
      this.selectedWeekdays = [
        { day: 'Sunday', selected: true },
        { day: 'Monday', selected: true },
        { day: 'Tuesday', selected: true },
        { day: 'Wednesday', selected: true },
        { day: 'Thursday', selected: true },
        { day: 'Friday', selected: true },
        { day: 'Saturday', selected: true },
      ];
    }
    this.weekdaysSelectedEvent.emit(this.selectedWeekdays);
  }
}
