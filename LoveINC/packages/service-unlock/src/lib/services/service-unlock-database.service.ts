import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';
import type { UnlockState } from '../types/service-unlock.types';

/**
 * Service Unlock Database Service
 *
 * Handles SQLite connection and schema for intake unlock state.
 * Supports iOS, Android, and Web (via jeep-sqlite).
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceUnlockDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform: string = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static isInitializing = false;
  private readonly DB_NAME = 'service_unlock';

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
    if (ServiceUnlockDatabaseService.isInitializing) {
      while (ServiceUnlockDatabaseService.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (ServiceUnlockDatabaseService.sharedDb) {
        this.db = ServiceUnlockDatabaseService.sharedDb;
        return;
      }
    }

    ServiceUnlockDatabaseService.isInitializing = true;

    try {
      try {
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        if (typeof this.db.isDBOpen === 'function') {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen) await this.db.open();
        }
        ServiceUnlockDatabaseService.sharedDb = this.db;
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
      ServiceUnlockDatabaseService.sharedDb = this.db;
      await this.createTables();
    } finally {
      ServiceUnlockDatabaseService.isInitializing = false;
    }
  }

  private async createTables(): Promise<void> {
    const db = await this.getDbConnection();
    const sql = `
      CREATE TABLE IF NOT EXISTS unlock_state (
        id TEXT PRIMARY KEY,
        intake_completed_at TEXT NOT NULL
      );
    `;
    await db.execute(sql);
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

  async getUnlockState(): Promise<UnlockState | null> {
    const db = await this.getDbConnection();
    const result = await db.query(
      'SELECT id, intake_completed_at FROM unlock_state LIMIT 1'
    );
    const rows = result.values ?? [];
    if (rows.length === 0) return null;
    const row = rows[0] as { id: string; intake_completed_at: string };
    return { id: row.id, intakeCompletedAt: row.intake_completed_at };
  }

  async setUnlockState(): Promise<void> {
    const db = await this.getDbConnection();
    const id = 'intake';
    const intakeCompletedAt = new Date().toISOString();
    await db.run(
      'INSERT OR REPLACE INTO unlock_state (id, intake_completed_at) VALUES (?, ?)',
      [id, intakeCompletedAt]
    );
  }

  async clearUnlockState(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute('DELETE FROM unlock_state');
  }
}
