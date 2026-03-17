import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import type { Habit } from '@upstart-productions/goal-tracker';

@Component({
  selector: 'app-habit-card',
  templateUrl: 'habit-card.component.html',
  styleUrls: ['habit-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class HabitCardComponent {
  @Input() habit!: Habit;
  @Input() selectedDate = '';
  @Input() isCompleted = false;
  @Input() allowComplete = true;
  @Input() allowEdit = false;

  @Output() habitMarkedEvent = new EventEmitter<{ habitId: number; date: string; completed: boolean }>();
  @Output() habitEditEvent = new EventEmitter<Habit>();

  markHabit() {
    if (!this.allowComplete || !this.habit?.id) return;
    this.habitMarkedEvent.emit({
      habitId: this.habit.id,
      date: this.selectedDate,
      completed: !this.isCompleted,
    });
  }

  editHabit() {
    this.habitEditEvent.emit(this.habit);
  }

  get borderClass(): string {
    const color = this.habit?.color ?? 'prussian-blue';
    return `border-${color}`;
  }

  get iconColor(): string {
    return this.habit?.color ?? 'prussian-blue';
  }
}
