import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

/**
 * GrovLink Database Service
 *
 * Generic app database for features that need local storage (e.g. read notifications).
 * Supports iOS, Android, and Web (via jeep-sqlite).
 */
@Injectable({
  providedIn: 'root',
})
export class GrovLinkDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform: string = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static isInitializing = false;
  private readonly DB_NAME = 'grovlink';

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
    // Keep JS connection map matches native (see NephoPhone database-base); avoids stale handles after resume/restart
    if (Capacitor.isNativePlatform()) {
      try {
        const { result } = await this.sqlite.checkConnectionsConsistency();
        if (result === false) {
          GrovLinkDatabaseService.sharedDb = null;
          this.db = null;
        }
      } catch {
        GrovLinkDatabaseService.sharedDb = null;
        this.db = null;
      }
    }
    return true;
  }

  async openDatabase(): Promise<void> {
    if (GrovLinkDatabaseService.isInitializing) {
      while (GrovLinkDatabaseService.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (GrovLinkDatabaseService.sharedDb) {
        this.db = GrovLinkDatabaseService.sharedDb;
        return;
      }
    }

    GrovLinkDatabaseService.isInitializing = true;

    try {
      try {
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
        if (typeof this.db.isDBOpen === 'function') {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen) await this.db.open();
        }
        GrovLinkDatabaseService.sharedDb = this.db;
        await this.createTables();
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
      GrovLinkDatabaseService.sharedDb = this.db;
      await this.createTables();
    } finally {
      GrovLinkDatabaseService.isInitializing = false;
    }
  }

  private async createTables(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS read_notifications (
        id TEXT PRIMARY KEY,
        readAt TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS verse_of_the_day_cache (
        dateKey TEXT PRIMARY KEY,
        json TEXT NOT NULL
      );
    `);
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

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const db = await this.getDbConnection();
    await db.run(
      'INSERT OR REPLACE INTO read_notifications (id, readAt) VALUES (?, ?)',
      [notificationId, new Date().toISOString()]
    );
  }

  async getReadNotificationIds(): Promise<Set<string>> {
    const db = await this.getDbConnection();
    const result = await db.query('SELECT id FROM read_notifications');
    const ids = new Set<string>();
    for (const row of result?.values ?? []) {
      let raw: unknown;
      if (Array.isArray(row)) {
        raw = row[0];
      } else if (row && typeof row === 'object' && 'id' in row) {
        raw = (row as Record<string, unknown>)['id'];
      }
      const key = raw !== null && raw !== undefined ? String(raw).trim() : '';
      if (key) ids.add(key);
    }
    return ids;
  }
}
