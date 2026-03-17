import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';

/**
 * Goal Tracker Database Service
 *
 * Handles SQLite connection and schema for the goal-tracker package.
 * Supports iOS, Android, and Web (via jeep-sqlite).
 */
@Injectable({
  providedIn: 'root',
})
export class GoalTrackerDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform: string = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static isInitializing = false;
  private readonly DB_NAME = 'goal_tracker';

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
      // Plugin may not be ready on web before jeep-sqlite init
    }
    return true;
  }

  async openDatabase(): Promise<void> {
    if (GoalTrackerDatabaseService.isInitializing) {
      while (GoalTrackerDatabaseService.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (GoalTrackerDatabaseService.sharedDb) {
        this.db = GoalTrackerDatabaseService.sharedDb;
        return;
      }
    }

    GoalTrackerDatabaseService.isInitializing = true;

    try {
      try {
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        if (typeof this.db.isDBOpen === 'function') {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen) await this.db.open();
        }
        GoalTrackerDatabaseService.sharedDb = this.db;
        return;
      } catch {
        // No existing connection
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
      GoalTrackerDatabaseService.sharedDb = this.db;
      await this.createTables();
    } finally {
      GoalTrackerDatabaseService.isInitializing = false;
    }
  }

  private async createTables(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        progress REAL NOT NULL DEFAULT 0,
        target REAL,
        color TEXT,
        category TEXT,
        dueDate TEXT,
        startDate TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goalId INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        schedule TEXT NOT NULL,
        progressIncrement REAL NOT NULL DEFAULT 0,
        reminderTime TEXT,
        startDate TEXT NOT NULL,
        endDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (goalId) REFERENCES goals(id)
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habitId INTEGER NOT NULL,
        date TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT,
        UNIQUE(habitId, date),
        FOREIGN KEY (habitId) REFERENCES habits(id)
      );
    `);
    await this.migrateGoalsTable(db);
  }

  private async migrateGoalsTable(db: SQLiteDBConnection): Promise<void> {
    try {
      await db.query('SELECT color FROM goals LIMIT 1');
    } catch {
      try {
        await db.execute('ALTER TABLE goals ADD COLUMN color TEXT');
      } catch {
        /* column may already exist */
      }
      try {
        await db.execute('ALTER TABLE goals ADD COLUMN startDate TEXT');
      } catch {
        /* column may already exist */
      }
    }
  }

  async getDbConnection(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      await this.initializePlugin();
      await this.openDatabase();
    }
    if (!this.db) {
      throw new Error('Failed to establish database connection');
    }
    if (typeof this.db.isDBOpen === 'function') {
      const isOpen = await this.db.isDBOpen();
      if (!isOpen) await this.db.open();
    }
    return this.db;
  }

  async resetDatabase(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute('DROP TABLE IF EXISTS habit_completions');
    await db.execute('DROP TABLE IF EXISTS habits');
    await db.execute('DROP TABLE IF EXISTS goals');
    await this.createTables();
  }
}
