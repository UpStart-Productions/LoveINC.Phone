import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';

/**
 * SQLite for the journal package. Uses a dedicated DB file `loveinc_journal`.
 */
@Injectable({
  providedIn: 'root',
})
export class JournalDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static initPromise: Promise<void> | null = null;
  private readonly DB_NAME = 'loveinc_journal';

  constructor(private platformService: Platform) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializePlugin(): Promise<boolean> {
    if (this.platformService.is('ios') || this.platformService.is('android')) {
      this.platform = 'native';
    } else {
      this.platform = 'web';
    }
    try {
      await CapacitorSQLite.isSecretStored();
    } catch {
      // jeep-sqlite / timing
    }
    try {
      await this.sqlite.checkConnectionsConsistency();
    } catch {
      // ignore
    }
    return true;
  }

  async openDatabase(): Promise<void> {
    if (JournalDatabaseService.sharedDb) {
      this.db = JournalDatabaseService.sharedDb;
      return;
    }

    if (!JournalDatabaseService.initPromise) {
      JournalDatabaseService.initPromise = this.performOpenDatabase();
    }

    await JournalDatabaseService.initPromise;

    if (JournalDatabaseService.sharedDb) {
      this.db = JournalDatabaseService.sharedDb;
    }
  }

  private async performOpenDatabase(): Promise<void> {
    try {
      try {
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        if (typeof this.db.isDBOpen === 'function') {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen) await this.db.open();
        }
        JournalDatabaseService.sharedDb = this.db;
        return;
      } catch {
        // no prior connection
      }

      if (this.platform === 'web') {
        await this.sqlite.saveToStore(this.DB_NAME);
      }

      try {
        this.db = await this.sqlite.createConnection(
          this.DB_NAME,
          false,
          'no-encryption',
          1,
          false
        );
      } catch (error: unknown) {
        const msg = (error as Error)?.message ?? '';
        if (msg.includes('Connection') && msg.includes('already exists')) {
          this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        } else {
          throw error;
        }
      }

      await this.db.open();
      JournalDatabaseService.sharedDb = this.db;
      await this.createTables();
    } finally {
      JournalDatabaseService.initPromise = null;
    }
  }

  private async createTables(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    await this.migrateJournalEntries();
  }

  private async migrateJournalEntries(): Promise<void> {
    const db = await this.getDbConnection();
    try {
      await db.run('ALTER TABLE journal_entries ADD COLUMN planId TEXT');
    } catch {
      // Column already exists.
    }
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_plan_id
      ON journal_entries (planId)
      WHERE planId IS NOT NULL;
    `);
  }

  resetConnection(): void {
    this.db = null;
    JournalDatabaseService.sharedDb = null;
  }

  async getDbConnection(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      await this.initializePlugin();
      await this.openDatabase();
    }
    if (!this.db) {
      throw new Error('Failed to establish journal database connection');
    }
    if (typeof this.db.isDBOpen === 'function') {
      const isOpen = await this.db.isDBOpen();
      if (!isOpen) await this.db.open();
    }
    return this.db;
  }
}
