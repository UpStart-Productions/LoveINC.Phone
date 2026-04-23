import { Injectable } from '@angular/core';
import { JournalDatabaseService } from './journal-database.service';
import { JournalEntry } from '../types/journal-entry.model';

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
  }): JournalEntry {
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async getAll(): Promise<JournalEntry[]> {
    const db = await this.dbService.getDbConnection();
    const res = await db.query(
      'SELECT id, title, content, createdAt, updatedAt FROM journal_entries ORDER BY updatedAt DESC'
    );
    const values = (res?.values as Record<string, unknown>[]) ?? [];
    return values.map((row) =>
      this.rowToEntry({
        id: row['id'] as number,
        title: (row['title'] as string) ?? '',
        content: (row['content'] as string) ?? '',
        createdAt: (row['createdAt'] as string) ?? '',
        updatedAt: (row['updatedAt'] as string) ?? '',
      })
    );
  }

  async getById(id: number): Promise<JournalEntry | null> {
    const db = await this.dbService.getDbConnection();
    const res = await db.query(
      'SELECT id, title, content, createdAt, updatedAt FROM journal_entries WHERE id = ?',
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
    });
  }

  async create(entry: { title: string; content: string }): Promise<number> {
    const now = new Date().toISOString();
    const db = await this.dbService.getDbConnection();
    const result = await db.run(
      'INSERT INTO journal_entries (title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [entry.title, entry.content, now, now]
    );
    const id = result.changes?.lastId;
    if (typeof id !== 'number') {
      throw new Error('Failed to read new journal id');
    }
    return id;
  }

  async update(id: number, entry: { title: string; content: string }): Promise<void> {
    const now = new Date().toISOString();
    const db = await this.dbService.getDbConnection();
    await db.run(
      'UPDATE journal_entries SET title = ?, content = ?, updatedAt = ? WHERE id = ?',
      [entry.title, entry.content, now, id]
    );
  }

  async delete(id: number): Promise<void> {
    const db = await this.dbService.getDbConnection();
    await db.run('DELETE FROM journal_entries WHERE id = ?', [id]);
  }
}
