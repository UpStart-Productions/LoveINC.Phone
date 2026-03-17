import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  ModalController,
} from '@ionic/angular/standalone';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Goal, WeekdaySchedule } from '@upstart-productions/goal-tracker';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { WeekdayPickerComponent } from '../weekday-picker/weekday-picker.component';
import { GoalTrackerRefreshService } from '../../services/goal-tracker-refresh.service';

const COLOR_OPTIONS = [
  { color: 'prussian-blue' },
  { color: 'blue-ribbon' },
  { color: 'picton-blue' },
  { color: 'emerald' },
  { color: 'red-orange' },
  { color: 'magenta' },
  { color: 'purple-heart' },
  { color: 'amethyst' },
  { color: 'sunshade' },
];

const WEEKDAYS: WeekdaySchedule[] = [
  { day: 'Sunday', selected: false },
  { day: 'Monday', selected: true },
  { day: 'Tuesday', selected: true },
  { day: 'Wednesday', selected: true },
  { day: 'Thursday', selected: true },
  { day: 'Friday', selected: true },
  { day: 'Saturday', selected: true },
];

@Component({
  selector: 'app-add-goal-habit-modal',
  templateUrl: './add-goal-habit-modal.component.html',
  styleUrls: ['./add-goal-habit-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    ColorPickerComponent,
    WeekdayPickerComponent,
  ],
})
export class AddGoalHabitModalComponent implements OnInit {
  mode: 'goal' | 'habit' = 'goal';

  // Goal form
  goalTitle = '';
  goalDescription = '';
  goalColor = 'prussian-blue';
  goalTarget: number | null = null;
  goalStartDate = new Date().toISOString().slice(0, 10);
  goalDueDate = '';

  // Habit form
  habitName = '';
  habitDescription = '';
  habitColor = 'prussian-blue';
  habitGoalId: number | null = null;
  habitProgressIncrement = 1;
  habitStartDate = new Date().toISOString().slice(0, 10);
  habitEndDate = '';
  habitSchedule: WeekdaySchedule[] = [...WEEKDAYS];

  saving = false;
  error = '';
  goals: Goal[] = [];
  readonly colorConfig = COLOR_OPTIONS;

  constructor(
    private modalCtrl: ModalController,
    private goalService: GoalService,
    private habitService: HabitService,
    private refreshService: GoalTrackerRefreshService
  ) {}

  async ngOnInit() {
    this.goals = await this.goalService.getAllGoals();
    this.goals = this.goals.filter((g) => !g.completed);
    if (this.goals.length > 0 && !this.habitGoalId) {
      this.habitGoalId = this.goals[0].id ?? null;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save() {
    this.error = '';
    if (this.mode === 'goal') {
      await this.saveGoal();
    } else {
      await this.saveHabit();
    }
  }

  private async saveGoal() {
    if (!this.goalTitle?.trim()) {
      this.error = 'Please enter a goal name.';
      return;
    }
    this.saving = true;
    try {
      await this.goalService.createGoal({
        title: this.goalTitle.trim(),
        description: this.goalDescription.trim() || undefined,
        progress: 0,
        target: this.goalTarget ?? undefined,
        color: this.goalColor,
        startDate: this.goalStartDate,
        dueDate: this.goalDueDate || undefined,
        completed: false,
      });
      this.refreshService.requestRefresh();
      this.modalCtrl.dismiss({ saved: true }, 'confirm');
    } catch (e) {
      this.error = (e as Error)?.message ?? 'Failed to save goal.';
    } finally {
      this.saving = false;
    }
  }

  private async saveHabit() {
    if (!this.habitName?.trim()) {
      this.error = 'Please enter a habit name.';
      return;
    }
    if (!this.habitGoalId) {
      this.error = 'Please select a goal.';
      return;
    }
    const hasSchedule = this.habitSchedule?.some((s) => s.selected);
    if (!hasSchedule) {
      this.error = 'Please select at least one day.';
      return;
    }
    this.saving = true;
    try {
      await this.habitService.createHabit({
        goalId: this.habitGoalId,
        name: this.habitName.trim(),
        description: this.habitDescription.trim() || undefined,
        color: this.habitColor,
        schedule: this.habitSchedule,
        progressIncrement: this.habitProgressIncrement,
        startDate: this.habitStartDate,
        endDate: this.habitEndDate || undefined,
      });
      this.refreshService.requestRefresh();
      this.modalCtrl.dismiss({ saved: true }, 'confirm');
    } catch (e) {
      this.error = (e as Error)?.message ?? 'Failed to save habit.';
    } finally {
      this.saving = false;
    }
  }

  onScheduleChange(sched: WeekdaySchedule[]) {
    this.habitSchedule = sched;
  }
}
