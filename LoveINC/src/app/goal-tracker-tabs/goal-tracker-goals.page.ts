import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Goal, Habit } from '@upstart-productions/goal-tracker';
import { HabitCardComponent } from './components/habit-card/habit-card.component';
import { GoalTrackerRefreshService } from './services/goal-tracker-refresh.service';
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
    IonContent,
    HabitCardComponent,
  ],
})
export class GoalTrackerGoalsPage implements OnInit, OnDestroy {
  ionViewDidEnter() {
    this.loadData();
  }
  goalsWithHabits: GoalWithHabits[] = [];
  completionMap: Record<number, boolean> = {};
  loading = true;
  private refreshSub?: Subscription;
  private dateSub?: Subscription;

  constructor(
    private goalService: GoalService,
    private habitService: HabitService,
    private refreshService: GoalTrackerRefreshService,
    private dateService: GoalTrackerDateService
  ) {}

  get selectedDate(): string {
    return this.dateService.selectedDate;
  }

  async ngOnInit() {
    await this.loadData();
    this.refreshSub = this.refreshService.onRefresh.subscribe(() => this.loadData());
    this.dateSub = this.dateService.onSelectedDateChange
      .pipe(skip(1))
      .subscribe(() => this.refreshGoalsForDate());
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
    this.dateSub?.unsubscribe();
  }

  async loadData() {
    this.loading = true;
    try {
      const completed = await this.habitService.getDatesWithAnyCompletion();
      this.dateService.completedDates = completed;
      await this.refreshGoalsForDate();
    } finally {
      this.loading = false;
    }
  }

  private async refreshGoalsForDate() {
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

  onHabitEdit(_habit: Habit) {
    // TODO: open edit habit modal
  }
}
