import { Component, Input, OnInit } from '@angular/core';
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
  IonNote,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  ModalController,
} from '@ionic/angular/standalone';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Goal, Habit, WeekdaySchedule } from '@upstart-productions/goal-tracker';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { WeekdayPickerComponent } from '../weekday-picker/weekday-picker.component';
import { DatePickerModalComponent } from '../date-picker-modal/date-picker-modal.component';
import { GoalTrackerRefreshService } from '../../services/goal-tracker-refresh.service';
import { GoalTrackerEditService } from '../../services/goal-tracker-edit.service';

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
    IonNote,
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
  @Input() edit = false;
  @Input() editGoal = false;
  @Input() habit?: Habit;

  get pageTitle(): string {
    if (this.edit && this.editGoal) return 'Edit Goal';
    if (this.edit || this.habit) return 'Edit Habit';
    return this.mode === 'goal' ? 'Add Goal' : 'Add Habit';
  }

  // Goal form
  goalTitle = '';
  goalDescription = '';
  goalColor = 'prussian-blue';
  goalTarget: number | null = null;
  goalDueDate = '';

  // Habit form
  habitName = '';
  habitDescription = '';
  habitColor = 'prussian-blue';
  habitGoalId: number | null = null;
  habitProgressIncrement = 1;
  habitSchedule: WeekdaySchedule[] = [...WEEKDAYS];

  saving = false;
  error = '';
  goals: Goal[] = [];
  readonly colorConfig = COLOR_OPTIONS;

  constructor(
    private modalCtrl: ModalController,
    private goalService: GoalService,
    private habitService: HabitService,
    private refreshService: GoalTrackerRefreshService,
    private editService: GoalTrackerEditService
  ) {}

  async ngOnInit() {
    this.goals = await this.goalService.getAllGoals();
    this.goals = this.goals.filter((g) => !g.completed);

    const goal = this.editService.getEditGoal();
    if (goal && this.editGoal) {
      this.mode = 'goal';
      this.edit = true;
      this.goalTitle = goal.title;
      this.goalDescription = goal.description ?? '';
      this.goalColor = goal.color ?? 'prussian-blue';
      this.goalTarget = goal.target ?? null;
      this.goalDueDate = goal.dueDate ?? '';
    }

    const habit = this.habit ?? this.editService.getEditHabit();
    if (habit) {
      this.habit = habit;
      this.mode = 'habit';
      this.edit = true;
      this.habitName = habit.name;
      this.habitDescription = habit.description ?? '';
      this.habitColor = habit.color ?? 'prussian-blue';
      this.habitGoalId = habit.goalId ?? null;
      this.habitProgressIncrement = habit.progressIncrement ?? 1;
      this.habitSchedule = habit.schedule?.length
        ? [...habit.schedule]
        : [...WEEKDAYS];
    } else if (this.goals.length > 0 && !this.habitGoalId) {
      this.habitGoalId = this.goals[0].id ?? null;
    }
  }

  ionViewWillLeave() {
    this.editService.clear();
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
      const goal = this.editService.getEditGoal();
      if (goal?.id) {
        await this.goalService.updateGoal(goal.id, {
          title: this.goalTitle.trim(),
          description: this.goalDescription.trim() || undefined,
          target: this.goalTarget ?? undefined,
          color: this.goalColor,
          dueDate: this.goalDueDate || undefined,
        });
      } else {
        await this.goalService.createGoal({
          title: this.goalTitle.trim(),
          description: this.goalDescription.trim() || undefined,
          progress: 0,
          target: this.goalTarget ?? undefined,
          color: this.goalColor,
          dueDate: this.goalDueDate || undefined,
          completed: false,
        });
      }
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
      const habitId = this.habit?.id;
      if (this.habit && habitId) {
        await this.habitService.updateHabit(habitId, {
          goalId: this.habitGoalId,
          name: this.habitName.trim(),
          description: this.habitDescription.trim() || undefined,
          color: this.habitColor,
          schedule: this.habitSchedule,
          progressIncrement: this.habitProgressIncrement,
          startDate: '1970-01-01',
          endDate: null,
        });
      } else {
        await this.habitService.createHabit({
          goalId: this.habitGoalId,
          name: this.habitName.trim(),
          description: this.habitDescription.trim() || undefined,
          color: this.habitColor,
          schedule: this.habitSchedule,
          progressIncrement: this.habitProgressIncrement,
        });
      }
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

  async openDatePicker(title: string, currentValue: string): Promise<string | null> {
    const modal = await this.modalCtrl.create({
      component: DatePickerModalComponent,
      componentProps: { title, value: currentValue },
      cssClass: 'date-picker-modal-sheet',
      showBackdrop: true,
      backdropDismiss: true,
      breakpoints: [0, 0.55, 1],
      initialBreakpoint: 0.55,
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string>();
    return role === 'confirm' && data ? data : null;
  }

  async pickGoalDueDate() {
    const picked = await this.openDatePicker('Due date', this.goalDueDate);
    if (picked) this.goalDueDate = picked;
  }

  formatDateDisplay(value: string): string {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
