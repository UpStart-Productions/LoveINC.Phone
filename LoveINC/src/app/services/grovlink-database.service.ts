import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

/** Body sent to POST class-registration; stored locally after a successful submit. */
export interface ClassRegistrationPayloadForStorage {
  classId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mailingAddress: string;
  birthDate: string;
  answers?: Record<string, string | number | boolean>;
  deviceId?: string;
}

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
    await db.execute(`
      CREATE TABLE IF NOT EXISTS class_registrations (
        id TEXT PRIMARY KEY,
        server_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        class_title TEXT,
        class_schedule_label TEXT,
        submitted_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_class_registrations_class_id
      ON class_registrations (class_id);
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transformation_tool_responses (
        tool_id TEXT NOT NULL,
        input_key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (tool_id, input_key)
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

  /**
   * Persist a successful class registration for this device (GrovLink SQLite).
   */
  async saveClassRegistration(params: {
    serverId: string;
    classId: string;
    classTitle?: string | null;
    classScheduleLabel?: string | null;
    payload: ClassRegistrationPayloadForStorage;
  }): Promise<string> {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const submittedAt = new Date().toISOString();
    const db = await this.getDbConnection();
    await db.run(
      `INSERT INTO class_registrations (
        id, server_id, class_id, class_title, class_schedule_label, submitted_at, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.serverId,
        params.classId,
        params.classTitle ?? null,
        params.classScheduleLabel ?? null,
        submittedAt,
        JSON.stringify(params.payload),
      ]
    );
    return id;
  }

  /** True if this device has a locally stored successful registration for the class. */
  async isRegisteredForClass(classId: string): Promise<boolean> {
    const id = classId?.trim();
    if (!id) return false;
    try {
      const db = await this.getDbConnection();
      const result = await db.query(
        'SELECT 1 AS ok FROM class_registrations WHERE class_id = ? LIMIT 1',
        [id]
      );
      const rows = result?.values ?? [];
      return rows.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Save a single Transformation Tool response input's value for this device.
   * `inputKey` should uniquely identify the input within the tool (e.g. `${stepOrder}:${inputIndex}`).
   */
  async saveTransformationToolResponse(
    toolId: string,
    inputKey: string,
    value: string | string[]
  ): Promise<void> {
    const db = await this.getDbConnection();
    await db.run(
      `INSERT OR REPLACE INTO transformation_tool_responses (tool_id, input_key, value_json, updated_at)
       VALUES (?, ?, ?, ?)`,
      [toolId, inputKey, JSON.stringify(value), new Date().toISOString()]
    );
  }

  /** Get all saved response values for a tool, keyed by inputKey. */
  async getTransformationToolResponses(
    toolId: string
  ): Promise<Record<string, string | string[]>> {
    try {
      const db = await this.getDbConnection();
      const result = await db.query(
        'SELECT input_key, value_json FROM transformation_tool_responses WHERE tool_id = ?',
        [toolId]
      );
      const responses: Record<string, string | string[]> = {};
      for (const row of result?.values ?? []) {
        const inputKey = (row as Record<string, unknown>)['input_key'];
        const valueJson = (row as Record<string, unknown>)['value_json'];
        if (typeof inputKey !== 'string' || typeof valueJson !== 'string') continue;
        try {
          responses[inputKey] = JSON.parse(valueJson);
        } catch {
          // Skip malformed rows
        }
      }
      return responses;
    } catch {
      return {};
    }
  }

  /** Clear all saved responses for a tool (e.g. "Start over"). */
  async clearTransformationToolResponses(toolId: string): Promise<void> {
    const db = await this.getDbConnection();
    await db.run('DELETE FROM transformation_tool_responses WHERE tool_id = ?', [toolId]);
  }
}
