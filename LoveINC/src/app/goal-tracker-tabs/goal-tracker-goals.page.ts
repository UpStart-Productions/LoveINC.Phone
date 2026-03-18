import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Goal, Habit } from '@upstart-productions/goal-tracker';
import { HabitCardComponent } from './components/habit-card/habit-card.component';
import { DateScrollerComponent, DateScrollerDate } from './components/date-scroller/date-scroller.component';
import { GoalTrackerRefreshService } from './services/goal-tracker-refresh.service';
import { GoalTrackerModalService } from './services/goal-tracker-modal.service';
import { GoalTrackerDateService } from './services/goal-tracker-date.service';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';

export interface GoalWithHabits {
  goal: Goal;
  habits: Habit[];
}

@Component({
  selector: 'app-goal-tracker-goals',
  templateUrl: './goal-tracker-goals.page.html',
  styleUrls: ['./goal-tracker-goals.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    HabitCardComponent,
    DateScrollerComponent,
  ],
})
export class GoalTrackerGoalsPage implements OnInit, OnDestroy {
  ionViewDidEnter() {
    this.loadData();
  }
  goalsWithHabits: GoalWithHabits[] = [];
  completionMap: Record<number, boolean> = {};
  loading = true;
  private documentWasHidden = false;
  private appStateListener: { remove: () => Promise<void> } | null = null;
  private refreshSub?: Subscription;
  private dateSub?: Subscription;

  constructor(
    private goalService: GoalService,
    private habitService: HabitService,
    private refreshService: GoalTrackerRefreshService,
    private dateService: GoalTrackerDateService,
    private modalService: GoalTrackerModalService
  ) {}

  get selectedDate(): string {
    return this.dateService.selectedDate;
  }

  get completedDates(): string[] {
    return this.dateService.completedDates;
  }

  onDateSelected(date: DateScrollerDate) {
    this.dateService.selectedDate = date.date;
  }

  async ngOnInit() {
    await this.loadData();
    this.refreshSub = this.refreshService.onRefresh.subscribe(() => this.loadData());
    this.dateSub = this.dateService.onSelectedDateChange
      .pipe(skip(1))
      .subscribe(() => this.refreshGoalsForDate());
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
    // Listen directly for app foreground (bypasses requestRefresh chain)
    try {
      this.appStateListener = await App.addListener('appStateChange', (state) => {
        if (state.isActive) this.loadData();
      });
    } catch {
      // App plugin not available (e.g. browser)
    }
  }

  async ngOnDestroy() {
    this.refreshSub?.unsubscribe();
    this.dateSub?.unsubscribe();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (this.appStateListener) {
      try {
        await this.appStateListener.remove();
      } catch {}
    }
  }

  private onVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.documentWasHidden = true;
    } else if (this.documentWasHidden) {
      this.documentWasHidden = false;
      this.loadData();
    }
  };

  async loadData() {
    /* Only show loading spinner on initial load. Avoid setting loading=true on refresh
     * (e.g. from ionViewDidEnter) – that DOM switch breaks ion-content touch handling. */
    const isInitialLoad = this.goalsWithHabits.length === 0;
    if (isInitialLoad) this.loading = true;
    try {
      await this.refreshGoalsForDate();
      const completed = await this.habitService.getDatesWithAnyCompletion();
      this.dateService.completedDates = completed;
    } catch (err) {
      console.warn('Goal Tracker loadData error:', err);
    } finally {
      this.loading = false;
    }
  }

  private async refreshGoalsForDate(): Promise<void> {
    const allGoals = await this.goalService.getAllGoals();
    const allHabits = await this.habitService.getAllHabits();
    const sel = this.dateService.selectedDate;

    const goalsWithHabits: GoalWithHabits[] = [];
    const completionMap: Record<number, boolean> = {};

    for (const goal of allGoals) {
      if (goal.completed) continue;
      const habitsForGoal = allHabits.filter((h: Habit) => h.goalId === goal.id);
      const scheduledHabits = habitsForGoal.filter((h: Habit) =>
        this.habitService.isHabitScheduledForDate(h, sel)
      );
      if (scheduledHabits.length > 0) {
        goalsWithHabits.push({ goal, habits: scheduledHabits });
        for (const h of scheduledHabits) {
          const c = await this.habitService.getCompletion(h.id!, sel);
          completionMap[h.id!] = c?.completed ?? false;
        }
      }
    }
    this.goalsWithHabits = goalsWithHabits;
    this.completionMap = completionMap;
  }

  async onHabitMarked(payload: { habitId: number; date: string; completed: boolean }) {
    await this.habitService.setCompletion(
      payload.habitId,
      payload.date,
      payload.completed
    );
    this.completionMap = { ...this.completionMap, [payload.habitId]: payload.completed };
    this.dateService.completedDates = await this.habitService.getDatesWithAnyCompletion();
  }

  onHabitEdit(habit: Habit) {
    this.modalService.openEditHabit(habit);
  }

  onGoalEdit(goal: Goal) {
    this.modalService.openEditGoal(goal);
  }
}
