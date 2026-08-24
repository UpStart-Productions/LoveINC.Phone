import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';

/**
 * Simple Budget Database Service
 *
 * Handles SQLite connection and schema for the simple-budget package.
 * Supports iOS, Android, and Web (via jeep-sqlite).
 */
@Injectable({
  providedIn: 'root',
})
export class SimpleBudgetDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static initPromise: Promise<void> | null = null;
  private readonly DB_NAME = 'simple_budget';

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
    try {
      await this.sqlite.checkConnectionsConsistency();
    } catch {
      // Ignore
    }
    return true;
  }

  /** Re-sync JS/native SQLite handles after long background (iOS WKWebView resume). */
  async reconcileConnectionsOnResume(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      const { result } = await this.sqlite.checkConnectionsConsistency();
      if (result !== false) {
        return;
      }
    } catch {
      // Fall through to reset stale handles.
    }
    this.resetConnection();
    SimpleBudgetDatabaseService.initPromise = null;
    await this.getDbConnection().catch(() => {});
  }

  async openDatabase(): Promise<void> {
    if (SimpleBudgetDatabaseService.sharedDb) {
      this.db = SimpleBudgetDatabaseService.sharedDb;
      return;
    }

    if (!SimpleBudgetDatabaseService.initPromise) {
      SimpleBudgetDatabaseService.initPromise = this.performOpenDatabase();
    }

    await SimpleBudgetDatabaseService.initPromise;

    if (SimpleBudgetDatabaseService.sharedDb) {
      this.db = SimpleBudgetDatabaseService.sharedDb;
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
        SimpleBudgetDatabaseService.sharedDb = this.db;
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
      SimpleBudgetDatabaseService.sharedDb = this.db;
      await this.createTables();
    } finally {
      SimpleBudgetDatabaseService.initPromise = null;
    }
  }

  private async createTables(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS week_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start_date TEXT NOT NULL UNIQUE,
        starting_balance REAL NOT NULL DEFAULT 0,
        notes TEXT,
        strategy_notes TEXT,
        review_what_changed TEXT,
        review_new_money TEXT,
        review_bills_higher TEXT,
        review_notes TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS category_instances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_plan_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        visible INTEGER NOT NULL DEFAULT 1,
        is_custom INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (week_plan_id) REFERENCES week_plans(id) ON DELETE CASCADE
      );
    `);
    try {
      await db.execute('ALTER TABLE category_instances ADD COLUMN notes TEXT');
    } catch {
      // Column may already exist
    }
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_category_instances_week_plan
      ON category_instances(week_plan_id);
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_category_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_category_templates_name_type
      ON user_category_templates(name, type);
    `);
  }

  resetConnection(): void {
    this.db = null;
    SimpleBudgetDatabaseService.sharedDb = null;
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

  async wipeAll(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute('DELETE FROM category_instances');
    await db.execute('DELETE FROM week_plans');
    await db.execute('DELETE FROM user_category_templates');
  }

  async resetDatabase(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute('DROP TABLE IF EXISTS category_instances');
    await db.execute('DROP TABLE IF EXISTS week_plans');
    await db.execute('DROP TABLE IF EXISTS user_category_templates');
    await this.createTables();
  }
}
