import { Injectable } from '@angular/core';
import { GoalTrackerDatabaseService } from './goal-tracker-database.service';
import { GoalService } from './goal.service';
import { HabitService } from './habit.service';
import type { Habit, WeekdaySchedule } from '../types/habit.types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return WEEKDAYS[d.getDay()];
}

function isScheduledForDate(habit: Habit, dateStr: string): boolean {
  const weekday = getWeekday(dateStr);
  return !!habit.schedule?.find((s) => s.day === weekday && s.selected);
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const ALL_DAYS: WeekdaySchedule[] = WEEKDAYS.map((day) => ({ day, selected: true }));
const WEEKDAYS_ONLY: WeekdaySchedule[] = WEEKDAYS.map((day) => ({
  day,
  selected: day !== 'Sunday' && day !== 'Saturday',
}));

const SEED_START = '2025-09-01';
const SEED_END = '2026-09-01';
const COMPLETION_RATE = 0.6;

/**
 * Seeds the goal tracker database with ~1 year of dummy data (Sept 1, 2025 – Sept 1, 2026)
 * for chart development. Resets the database first, then creates 5 goals (2 completed),
 * 2–3 habits each, and habit completions.
 */
@Injectable({
  providedIn: 'root',
})
export class GoalTrackerSeedService {
  constructor(
    private db: GoalTrackerDatabaseService,
    private goalService: GoalService,
    private habitService: HabitService
  ) {}

  async seedDatabase(): Promise<void> {
    await this.db.resetDatabase();

    const startDate = new Date(SEED_START + 'T12:00:00');
    const endDate = new Date(SEED_END + 'T12:00:00');
    const now = new Date().toISOString();

    // Create 5 goals (2 completed)
    const goal1 = await this.goalService.createGoal({
      title: 'Exercise',
      description: 'Build a consistent fitness routine',
      progress: 0,
      target: 100,
      color: 'prussian-blue',
      dueDate: '2026-06-01',
      completed: false,
    });

    const goal2 = await this.goalService.createGoal({
      title: 'Spiritual Growth',
      description: 'Daily devotional and prayer',
      progress: 100,
      target: 100,
      color: 'emerald',
      dueDate: '2026-03-15',
      completed: true,
    });

    const goal3 = await this.goalService.createGoal({
      title: 'Reading',
      description: 'Read 24 books this year',
      progress: 0,
      target: 24,
      color: 'blue-ribbon',
      dueDate: '2026-09-01',
      completed: false,
    });

    const goal4 = await this.goalService.createGoal({
      title: 'Save for Vacation',
      description: 'Put aside $2000',
      progress: 2000,
      target: 2000,
      color: 'red-orange',
      dueDate: '2026-07-01',
      completed: true,
    });

    const goal5 = await this.goalService.createGoal({
      title: 'Learn Spanish',
      description: '15 min daily practice',
      progress: 0,
      target: undefined,
      color: 'purple-heart',
      dueDate: '2026-12-31',
      completed: false,
    });

    // Create habits (2–3 per goal)
    const habit1a = await this.habitService.createHabit({
      goalId: goal1.id!,
      name: 'Morning Run',
      color: 'prussian-blue',
      schedule: WEEKDAYS_ONLY,
      progressIncrement: 1,
    });
    const habit1b = await this.habitService.createHabit({
      goalId: goal1.id!,
      name: 'Push-ups',
      description: '20 reps',
      color: 'blue-ribbon',
      schedule: ALL_DAYS,
      progressIncrement: 1,
    });
    const habit1c = await this.habitService.createHabit({
      goalId: goal1.id!,
      name: 'Stretching',
      color: 'picton-blue',
      schedule: ALL_DAYS,
      progressIncrement: 0,
    });

    const habit2a = await this.habitService.createHabit({
      goalId: goal2.id!,
      name: 'Daily Devotional',
      color: 'emerald',
      schedule: ALL_DAYS,
      progressIncrement: 0,
    });
    const habit2b = await this.habitService.createHabit({
      goalId: goal2.id!,
      name: 'Prayer Time',
      color: 'red-orange',
      schedule: ALL_DAYS,
      progressIncrement: 0,
    });

    const habit3a = await this.habitService.createHabit({
      goalId: goal3.id!,
      name: 'Read 30 min',
      color: 'blue-ribbon',
      schedule: ALL_DAYS,
      progressIncrement: 0,
    });
    const habit3b = await this.habitService.createHabit({
      goalId: goal3.id!,
      name: 'Log book finished',
      color: 'picton-blue',
      schedule: ALL_DAYS,
      progressIncrement: 1,
    });

    const habit4a = await this.habitService.createHabit({
      goalId: goal4.id!,
      name: 'Transfer $50',
      color: 'red-orange',
      schedule: WEEKDAYS_ONLY,
      progressIncrement: 50,
    });
    const habit4b = await this.habitService.createHabit({
      goalId: goal4.id!,
      name: 'Skip coffee',
      description: 'Save $5',
      color: 'magenta',
      schedule: ALL_DAYS,
      progressIncrement: 5,
    });

    const habit5a = await this.habitService.createHabit({
      goalId: goal5.id!,
      name: 'Duolingo',
      color: 'purple-heart',
      schedule: ALL_DAYS,
      progressIncrement: 0,
    });
    const habit5b = await this.habitService.createHabit({
      goalId: goal5.id!,
      name: 'Flashcards',
      color: 'amethyst',
      schedule: WEEKDAYS_ONLY,
      progressIncrement: 0,
    });

    const habits = [
      habit1a,
      habit1b,
      habit1c,
      habit2a,
      habit2b,
      habit3a,
      habit3b,
      habit4a,
      habit4b,
      habit5a,
      habit5b,
    ];

    // Bulk insert habit completions
    const conn = await this.db.getDbConnection();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = toDateStr(d);

      for (const habit of habits) {
        if (!isScheduledForDate(habit, dateStr)) continue;
        if (Math.random() > COMPLETION_RATE) continue;

        await conn.run(
          'INSERT OR IGNORE INTO habit_completions (habitId, date, completed, createdAt) VALUES (?, ?, 1, ?)',
          [habit.id, dateStr, now]
        );
      }
    }
  }
}
