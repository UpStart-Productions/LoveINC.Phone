import { Injectable } from '@angular/core';
import { Goal, GoalStats } from '../types/goal.types';

const STORAGE_KEY = 'goal_tracker_goals';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageGoalStorageService {
  private nextId = 1;

  private loadGoals(): Goal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Goal[];
      const maxId = parsed.reduce((m, g) => Math.max(m, g.id ?? 0), 0);
      this.nextId = maxId + 1;
      return parsed;
    } catch {
      return [];
    }
  }

  private saveGoals(goals: Goal[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }

  async createGoal(
    goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Goal> {
    const now = new Date().toISOString();
    const full: Goal = {
      ...goal,
      id: this.nextId++,
      createdAt: now,
      updatedAt: now,
    };
    const goals = this.loadGoals();
    goals.unshift(full);
    this.saveGoals(goals);
    return full;
  }

  async getAllGoals(): Promise<Goal[]> {
    const goals = this.loadGoals();
    return goals.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    });
  }

  async getGoalById(id: number): Promise<Goal | null> {
    return this.loadGoals().find((g) => g.id === id) ?? null;
  }

  async updateGoal(
    id: number,
    updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    const goals = this.loadGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx < 0) return false;
    goals[idx] = {
      ...goals[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveGoals(goals);
    return true;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const goals = this.loadGoals().filter((g) => g.id !== id);
    if (goals.length === this.loadGoals().length) return false;
    this.saveGoals(goals);
    return true;
  }

  async getStats(): Promise<GoalStats> {
    const goals = this.loadGoals();
    const completed = goals.filter((g) => g.completed).length;
    return {
      total: goals.length,
      completed,
      inProgress: goals.length - completed,
    };
  }
}
