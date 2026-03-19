import { Injectable } from '@angular/core';
import type { Goal, Habit } from '@upstart-productions/goal-tracker';

/**
 * Holds the goal or habit to edit when opening the add/edit modal.
 * Used to reliably pass data to the modal, which can have issues receiving
 * complex objects via ModalController componentProps on device.
 */
@Injectable({ providedIn: 'root' })
export class GoalTrackerEditService {
  private _habit: Habit | null = null;
  private _goal: Goal | null = null;

  setEditHabit(habit: Habit | null): void {
    this._habit = habit;
  }

  getEditHabit(): Habit | null {
    return this._habit;
  }

  setEditGoal(goal: Goal | null): void {
    this._goal = goal;
  }

  getEditGoal(): Goal | null {
    return this._goal;
  }

  clear(): void {
    this._habit = null;
    this._goal = null;
  }
}
