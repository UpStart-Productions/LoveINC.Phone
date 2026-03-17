import { Injectable } from '@angular/core';
import { GoalTrackerDatabaseService } from './goal-tracker-database.service';
import { Goal, GoalStats } from '../types/goal.types';

@Injectable({
  providedIn: 'root',
})
export class GoalService {
  constructor(private db: GoalTrackerDatabaseService) {}

  async createGoal(
    goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Goal> {
    const conn = await this.db.getDbConnection();
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO goals (title, description, progress, target, color, category, dueDate, startDate, completed, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await conn.run(sql, [
      goal.title,
      goal.description ?? null,
      goal.progress ?? 0,
      goal.target ?? null,
      goal.color ?? null,
      goal.category ?? null,
      goal.dueDate ?? null,
      goal.startDate ?? null,
      goal.completed ? 1 : 0,
      now,
      now,
    ]);
    return {
      id: result.changes?.lastId,
      ...goal,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAllGoals(): Promise<Goal[]> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query(
      'SELECT * FROM goals ORDER BY completed ASC, updatedAt DESC'
    );
    if (!result.values?.length) return [];
    return result.values.map((row: Record<string, unknown>) =>
      this.rowToGoal(row)
    );
  }

  async getGoalById(id: number): Promise<Goal | null> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query('SELECT * FROM goals WHERE id = ?', [id]);
    if (!result.values?.length) return null;
    return this.rowToGoal(result.values[0] as Record<string, unknown>);
  }

  async updateGoal(
    id: number,
    updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    const conn = await this.db.getDbConnection();
    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      params.push(updates.title);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      params.push(updates.description ?? null);
    }
    if (updates.progress !== undefined) {
      setClauses.push('progress = ?');
      params.push(updates.progress);
    }
    if (updates.target !== undefined) {
      setClauses.push('target = ?');
      params.push(updates.target ?? null);
    }
    if (updates.color !== undefined) {
      setClauses.push('color = ?');
      params.push(updates.color ?? null);
    }
    if (updates.category !== undefined) {
      setClauses.push('category = ?');
      params.push(updates.category ?? null);
    }
    if (updates.dueDate !== undefined) {
      setClauses.push('dueDate = ?');
      params.push(updates.dueDate ?? null);
    }
    if (updates.startDate !== undefined) {
      setClauses.push('startDate = ?');
      params.push(updates.startDate ?? null);
    }
    if (updates.completed !== undefined) {
      setClauses.push('completed = ?');
      params.push(updates.completed ? 1 : 0);
    }

    setClauses.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    const sql = `UPDATE goals SET ${setClauses.join(', ')} WHERE id = ?`;
    const result = await conn.run(sql, params as (string | number)[]);
    return (result.changes?.changes ?? 0) > 0;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const conn = await this.db.getDbConnection();
    const result = await conn.run('DELETE FROM goals WHERE id = ?', [id]);
    return (result.changes?.changes ?? 0) > 0;
  }

  async getStats(): Promise<GoalStats> {
    const conn = await this.db.getDbConnection();
    const result = await conn.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as inProgress
      FROM goals
    `);
    const row = result.values?.[0] as Record<string, number> | undefined;
    return {
      total: row?.['total'] ?? 0,
      completed: row?.['completed'] ?? 0,
      inProgress: row?.['inProgress'] ?? 0,
    };
  }

  private rowToGoal(row: Record<string, unknown>): Goal {
    return {
      id: row['id'] as number,
      title: row['title'] as string,
      description: row['description'] as string | undefined,
      progress: (row['progress'] as number) ?? 0,
      target: row['target'] as number | undefined,
      color: row['color'] as string | undefined,
      category: row['category'] as Goal['category'],
      dueDate: row['dueDate'] as string | undefined,
      startDate: row['startDate'] as string | undefined,
      completed: (row['completed'] as number) === 1,
      createdAt: row['createdAt'] as string,
      updatedAt: row['updatedAt'] as string,
    };
  }
}
