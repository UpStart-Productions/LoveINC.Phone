import { Injectable } from '@angular/core';
import { GoalTrackerDatabaseService } from './goal-tracker-database.service';
import { GoalService } from './goal.service';
import { Habit, HabitCompletion, WeekdaySchedule } from '../types/habit.types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return WEEKDAYS[d.getDay()];
}

function isBefore(dateStr: string, otherStr: string): boolean {
  return new Date(dateStr) < new Date(otherStr);
}

function isAfter(dateStr: string, otherStr: string): boolean {
  return new Date(dateStr) > new Date(otherStr);
}

/** Sentinel: habits with no start date show for all dates */
const NO_START_DATE = '1970-01-01';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  constructor(
    private db: GoalTrackerDatabaseService,
    private goalService: GoalService
  ) {}

  async createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    const conn = await this.db.getDbConnection();
    const now = new Date().toISOString();
    const scheduleJson = JSON.stringify(habit.schedule);
    const sql = `
      INSERT INTO habits (goalId, name, description, color, schedule, progressIncrement, reminderTime, startDate, endDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await conn.run(sql, [
      habit.goalId,
      habit.name,
      habit.description ?? null,
      habit.color,
      scheduleJson,
      habit.progressIncrement ?? 0,
      habit.reminderTime ?? null,
      habit.startDate ?? NO_START_DATE,
      habit.endDate ?? null,
      now,
      now,
    ]);
    return {
      id: result.changes?.lastId,
      ...habit,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getHabitsByGoalId(goalId: number): Promise<Habit[]> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query('SELECT * FROM habits WHERE goalId = ? ORDER BY createdAt ASC', [
      goalId,
    ]);
    if (!result.values?.length) return [];
    return result.values.map((row: Record<string, unknown>) => this.rowToHabit(row));
  }

  async getAllHabits(): Promise<Habit[]> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query('SELECT * FROM habits ORDER BY goalId, createdAt ASC');
    if (!result.values?.length) return [];
    return result.values.map((row: Record<string, unknown>) => this.rowToHabit(row));
  }

  async getHabitById(id: number): Promise<Habit | null> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query('SELECT * FROM habits WHERE id = ?', [id]);
    if (!result.values?.length) return null;
    return this.rowToHabit(result.values[0] as Record<string, unknown>);
  }

  async updateHabit(
    id: number,
    updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    const conn = await this.db.getDbConnection();
    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (updates.goalId !== undefined) {
      setClauses.push('goalId = ?');
      params.push(updates.goalId);
    }
    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      params.push(updates.description ?? null);
    }
    if (updates.color !== undefined) {
      setClauses.push('color = ?');
      params.push(updates.color);
    }
    if (updates.schedule !== undefined) {
      setClauses.push('schedule = ?');
      params.push(JSON.stringify(updates.schedule));
    }
    if (updates.progressIncrement !== undefined) {
      setClauses.push('progressIncrement = ?');
      params.push(updates.progressIncrement);
    }
    if (updates.reminderTime !== undefined) {
      setClauses.push('reminderTime = ?');
      params.push(updates.reminderTime ?? null);
    }
    if (updates.startDate !== undefined) {
      setClauses.push('startDate = ?');
      params.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      setClauses.push('endDate = ?');
      params.push(updates.endDate ?? null);
    }

    setClauses.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    const sql = `UPDATE habits SET ${setClauses.join(', ')} WHERE id = ?`;
    const result = await conn.run(sql, params as (string | number)[]);
    return (result.changes?.changes ?? 0) > 0;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const conn = await this.db.getDbConnection();
    await conn.run('DELETE FROM habit_completions WHERE habitId = ?', [id]);
    const result = await conn.run('DELETE FROM habits WHERE id = ?', [id]);
    return (result.changes?.changes ?? 0) > 0;
  }

  async getCompletion(habitId: number, date: string): Promise<HabitCompletion | null> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query(
      'SELECT * FROM habit_completions WHERE habitId = ? AND date = ?',
      [habitId, date]
    );
    if (!result.values?.length) return null;
    return this.rowToCompletion(result.values[0] as Record<string, unknown>);
  }

  async setCompletion(habitId: number, date: string, completed: boolean): Promise<void> {
    const conn = await this.db.getDbConnection();
    const existing = await this.getCompletion(habitId, date);
    const habit = await this.getHabitById(habitId);
    if (!habit) return;

    if (existing) {
      const wasCompleted = existing.completed === true;
      await conn.run(
        'UPDATE habit_completions SET completed = ?, createdAt = ? WHERE habitId = ? AND date = ?',
        [completed ? 1 : 0, new Date().toISOString(), habitId, date]
      );
      if (wasCompleted && !completed && habit.progressIncrement > 0) {
        const goal = await this.goalService.getGoalById(habit.goalId);
        if (goal) {
          await this.goalService.updateGoal(habit.goalId, {
            progress: Math.max(0, goal.progress - habit.progressIncrement),
          });
        }
      } else if (!wasCompleted && completed && habit.progressIncrement > 0) {
        const goal = await this.goalService.getGoalById(habit.goalId);
        if (goal) {
          await this.goalService.updateGoal(habit.goalId, {
            progress: goal.progress + habit.progressIncrement,
          });
        }
      }
    } else {
      await conn.run(
        'INSERT INTO habit_completions (habitId, date, completed, createdAt) VALUES (?, ?, ?, ?)',
        [habitId, date, completed ? 1 : 0, new Date().toISOString()]
      );
      if (completed && habit.progressIncrement > 0) {
        const goal = await this.goalService.getGoalById(habit.goalId);
        if (goal) {
          await this.goalService.updateGoal(habit.goalId, {
            progress: goal.progress + habit.progressIncrement,
          });
        }
      }
    }
  }

  /** Returns all dates that have at least one habit completion (for date scroller dots) */
  async getDatesWithAnyCompletion(): Promise<string[]> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query(
      'SELECT DISTINCT date FROM habit_completions WHERE completed = 1'
    );
    if (!result.values?.length) return [];
    return result.values.map((row: Record<string, unknown>) => row['date'] as string);
  }

  async getCompletedDatesForHabit(habitId: number): Promise<string[]> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query(
      'SELECT date FROM habit_completions WHERE habitId = ? AND completed = 1',
      [habitId]
    );
    if (!result.values?.length) return [];
    return result.values.map((row: Record<string, unknown>) => row['date'] as string);
  }

  /** Returns true if habit is scheduled for the given date (weekday only; habits have no date range) */
  isHabitScheduledForDate(habit: Habit, date: string): boolean {
    const weekday = getWeekday(date);
    const scheduled = habit.schedule?.find((s) => s.day === weekday && s.selected);
    if (!scheduled) return false;
    const start = habit.startDate;
    const end = habit.endDate;
    if (start && start !== NO_START_DATE && isBefore(date, start)) return false;
    if (end && isAfter(date, end)) return false;
    return true;
  }

  private rowToHabit(row: Record<string, unknown>): Habit {
    const scheduleRaw = row['schedule'];
    let schedule: WeekdaySchedule[] = [];
    if (typeof scheduleRaw === 'string') {
      try {
        schedule = JSON.parse(scheduleRaw) as WeekdaySchedule[];
      } catch {
        schedule = [];
      }
    }
    return {
      id: row['id'] as number,
      goalId: row['goalId'] as number,
      name: row['name'] as string,
      description: row['description'] as string | undefined,
      color: row['color'] as string,
      schedule,
      progressIncrement: (row['progressIncrement'] as number) ?? 0,
      reminderTime: row['reminderTime'] as string | undefined,
      startDate: (row['startDate'] as string) || NO_START_DATE,
      endDate: (row['endDate'] as string) || undefined,
      createdAt: row['createdAt'] as string,
      updatedAt: row['updatedAt'] as string,
    };
  }

  private rowToCompletion(row: Record<string, unknown>): HabitCompletion {
    return {
      id: row['id'] as number,
      habitId: row['habitId'] as number,
      date: row['date'] as string,
      completed: (row['completed'] as number) === 1,
      createdAt: row['createdAt'] as string | undefined,
    };
  }
}
