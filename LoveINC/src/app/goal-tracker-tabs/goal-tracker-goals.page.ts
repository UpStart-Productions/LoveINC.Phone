import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Goal, Habit } from '@upstart-productions/goal-tracker';
import { DateScrollerComponent, DateScrollerDate } from './components/date-scroller/date-scroller.component';
import { HabitCardComponent } from './components/habit-card/habit-card.component';

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
    DateScrollerComponent,
    HabitCardComponent,
  ],
})
export class GoalTrackerGoalsPage implements OnInit {
  selectedDate = '';
  completedDates: string[] = [];
  goalsWithHabits: GoalWithHabits[] = [];
  completionMap: Record<number, boolean> = {};
  loading = true;

  constructor(
    private goalService: GoalService,
    private habitService: HabitService
  ) {}

  async ngOnInit() {
    this.selectedDate = new Date().toISOString().slice(0, 10);
    await this.loadData();
  }

  onDateSelected(date: DateScrollerDate) {
    this.selectedDate = date.date;
    this.refreshGoalsForDate();
  }

  async loadData() {
    this.loading = true;
    try {
      this.completedDates = await this.habitService.getDatesWithAnyCompletion();
      await this.refreshGoalsForDate();
    } finally {
      this.loading = false;
    }
  }

  private async refreshGoalsForDate() {
    const allGoals = await this.goalService.getAllGoals();
    const allHabits = await this.habitService.getAllHabits();

    const goalsWithHabits: GoalWithHabits[] = [];
    const completionMap: Record<number, boolean> = {};

    for (const goal of allGoals) {
      if (goal.completed) continue;
      const habitsForGoal = allHabits.filter((h: Habit) => h.goalId === goal.id);
      const scheduledHabits = habitsForGoal.filter((h: Habit) =>
        this.habitService.isHabitScheduledForDate(h, this.selectedDate)
      );
      if (scheduledHabits.length > 0) {
        goalsWithHabits.push({ goal, habits: scheduledHabits });
        for (const h of scheduledHabits) {
          const c = await this.habitService.getCompletion(h.id!, this.selectedDate);
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
    this.completedDates = await this.habitService.getDatesWithAnyCompletion();
  }

  onHabitEdit(_habit: Habit) {
    // TODO: open edit habit modal
  }
}
