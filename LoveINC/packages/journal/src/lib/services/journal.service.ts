import { Injectable } from '@angular/core';
import { JournalDatabaseService } from './journal-database.service';
import { JournalEntry } from '../types/journal-entry.model';

export interface AppendPlanJournalEntryParams {
  planId: string;
  planTitle: string;
  themeName: string;
  appendHtml: string;
}

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  constructor(private dbService: JournalDatabaseService) {}

  private rowToEntry(r: {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    planId?: string | null;
  }): JournalEntry {
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      planId: r.planId ?? null,
    };
  }

  async getAll(): Promise<JournalEntry[]> {
    const db = await this.dbService.getDbConnection();
    const res = await db.query(
      'SELECT id, title, content, createdAt, updatedAt, planId FROM journal_entries ORDER BY updatedAt DESC'
    );
    const values = (res?.values as Record<string, unknown>[]) ?? [];
    return values.map((row) =>
      this.rowToEntry({
        id: row['id'] as number,
        title: (row['title'] as string) ?? '',
        content: (row['content'] as string) ?? '',
        createdAt: (row['createdAt'] as string) ?? '',
        updatedAt: (row['updatedAt'] as string) ?? '',
        planId: (row['planId'] as string | null | undefined) ?? null,
      })
    );
  }

  async getById(id: number): Promise<JournalEntry | null> {
    const db = await this.dbService.getDbConnection();
    const res = await db.query(
      'SELECT id, title, content, createdAt, updatedAt, planId FROM journal_entries WHERE id = ?',
      [id]
    );
    const row = res?.values?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.rowToEntry({
      id: row['id'] as number,
      title: (row['title'] as string) ?? '',
      content: (row['content'] as string) ?? '',
      createdAt: (row['createdAt'] as string) ?? '',
      updatedAt: (row['updatedAt'] as string) ?? '',
      planId: (row['planId'] as string | null | undefined) ?? null,
    });
  }

  async getByPlanId(planId: string): Promise<JournalEntry | null> {
    const id = planId.trim();
    if (!id) return null;
    const db = await this.dbService.getDbConnection();
    const res = await db.query(
      'SELECT id, title, content, createdAt, updatedAt, planId FROM journal_entries WHERE planId = ? LIMIT 1',
      [id]
    );
    const row = res?.values?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.rowToEntry({
      id: row['id'] as number,
      title: (row['title'] as string) ?? '',
      content: (row['content'] as string) ?? '',
      createdAt: (row['createdAt'] as string) ?? '',
      updatedAt: (row['updatedAt'] as string) ?? '',
      planId: (row['planId'] as string | null | undefined) ?? null,
    });
  }

  async create(entry: {
    title: string;
    content: string;
    planId?: string | null;
  }): Promise<number> {
    const now = new Date().toISOString();
    const db = await this.dbService.getDbConnection();
    const result = await db.run(
      'INSERT INTO journal_entries (title, content, createdAt, updatedAt, planId) VALUES (?, ?, ?, ?, ?)',
      [entry.title, entry.content, now, now, entry.planId ?? null]
    );
    const id = result.changes?.lastId;
    if (typeof id !== 'number') {
      throw new Error('Failed to read new journal id');
    }
    return id;
  }

  async update(
    id: number,
    entry: { title: string; content: string; planId?: string | null }
  ): Promise<void> {
    const now = new Date().toISOString();
    const db = await this.dbService.getDbConnection();
    if (entry.planId !== undefined) {
      await db.run(
        'UPDATE journal_entries SET title = ?, content = ?, updatedAt = ?, planId = ? WHERE id = ?',
        [entry.title, entry.content, now, entry.planId ?? null, id]
      );
      return;
    }
    await db.run(
      'UPDATE journal_entries SET title = ?, content = ?, updatedAt = ? WHERE id = ?',
      [entry.title, entry.content, now, id]
    );
  }

  async appendPlanJournalEntry(params: AppendPlanJournalEntryParams): Promise<void> {
    const planId = params.planId.trim();
    const appendHtml = params.appendHtml.trim();
    if (!planId || !appendHtml) {
      return;
    }

    const themeName = params.themeName.trim() || 'Learning';
    const planTitle = params.planTitle.trim() || 'Untitled';
    const themeHeader = `<p><strong>${this.escapeHtml(themeName)}</strong></p>`;
    const existing = await this.getByPlanId(planId);

    if (!existing) {
      await this.create({
        title: planTitle,
        content: `${themeHeader}${appendHtml}`,
        planId,
      });
      return;
    }

    await this.update(existing.id, {
      title: planTitle,
      content: `${existing.content}${appendHtml}`,
      planId,
    });
  }

  async delete(id: number): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run('DELETE FROM journal_entries WHERE id = ?', [id]);
  }

  private escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
