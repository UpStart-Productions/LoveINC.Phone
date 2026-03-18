import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import type { Goal, Habit } from '@upstart-productions/goal-tracker';
import { GoalTrackerDebugService } from '../../services/goal-tracker-debug.service';

@Component({
  selector: 'app-habit-card',
  templateUrl: 'habit-card.component.html',
  styleUrls: ['habit-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class HabitCardComponent {
  /** Goal card – when set, renders goal (badge, thicker border). Mutually exclusive with habit. */
  @Input() goal?: Goal;
  /** Habit card – when set, renders habit (checkbox, etc.). Mutually exclusive with goal. */
  @Input() habit?: Habit;
  @Input() selectedDate = '';
  @Input() isCompleted = false;
  @Input() allowComplete = true;
  @Input() allowEdit = false;
  /** When true, card has no side margin (e.g. nested under a goal card) */
  @Input() nested = false;

  @Output() habitMarkedEvent = new EventEmitter<{ habitId: number; date: string; completed: boolean }>();
  @Output() habitEditEvent = new EventEmitter<Habit>();
  @Output() goalEditEvent = new EventEmitter<Goal>();

  constructor(private debug: GoalTrackerDebugService) {}

  get isGoal(): boolean {
    return !!this.goal;
  }

  markHabit() {
    if (!this.allowComplete || !this.habit?.id) return;
    this.habitMarkedEvent.emit({
      habitId: this.habit.id,
      date: this.selectedDate,
      completed: !this.isCompleted,
    });
  }

  editHabit() {
    this.debug.trace(`1. habit-card editHabit() id=${this.habit?.id} name=${this.habit?.name}`);
    this.habitEditEvent.emit(this.habit!);
  }

  editGoal() {
    this.goalEditEvent.emit(this.goal!);
  }

  get borderClass(): string {
    const color = (this.goal ?? this.habit)?.color ?? 'prussian-blue';
    return `border-${color}`;
  }

  get iconColor(): string {
    return (this.habit ?? this.goal)?.color ?? 'prussian-blue';
  }

  get badgeColorClass(): string {
    const color = this.goal?.color ?? 'prussian-blue';
    return `background-${color}`;
  }

  get goalDueDateFormatted(): string {
    if (!this.goal?.dueDate) return '';
    const d = new Date(this.goal.dueDate + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  get goalDueDateBadge(): { month: string; day: string } | null {
    if (!this.goal?.dueDate) return null;
    const d = new Date(this.goal.dueDate + 'T00:00:00');
    return {
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      day: d.toLocaleDateString(undefined, { day: 'numeric' }),
    };
  }
}
