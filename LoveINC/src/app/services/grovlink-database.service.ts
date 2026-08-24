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

/** One versioned schema step. Migrations are additive-only (new tables/columns/indexes) —
 *  never DROP or RENAME, so an OTA rollback to an older JS bundle still works against a
 *  DB that's been migrated forward. `statements` run together in one transaction; if any
 *  statement throws, the whole migration (including the user_version bump) rolls back so
 *  it's retried cleanly on the next app launch instead of leaving the DB half-migrated. */
interface OtaDbMigration {
  version: number;
  description: string;
  statements: string[];
}

/**
 * GrovLink Database Service
 *
 * Generic app database for features that need local storage (e.g. read notifications).
 * Supports iOS, Android, and Web (via jeep-sqlite).
 *
 * Schema changes ship via OTA bundles, so this class owns a `PRAGMA user_version`-based
 * migration runner instead of a single `CREATE TABLE IF NOT EXISTS` block: every DB open
 * (fresh install AND every relaunch after that) runs `runMigrations()`, which applies only
 * the migrations newer than the DB's current user_version, in order. A brand-new install
 * starts at user_version 0 and runs every migration starting at MIGRATIONS[0]; an existing
 * install on disk just picks up whatever is newer than what it already has. This is what
 * replaces the old approach of calling createTables() ad hoc — there is no code path left
 * that opens this DB without going through the runner, so a migration can never be silently
 * skipped.
 *
 * To ship a schema change in a future OTA bundle: add a new entry to MIGRATIONS with the
 * next version number and additive-only SQL (ADD COLUMN / CREATE TABLE / CREATE INDEX).
 * Never edit an existing entry once it has shipped — devices that already applied it must
 * never see it change under them.
 */
@Injectable({
  providedIn: 'root',
})
export class GrovLinkDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform: string = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static initPromise: Promise<void> | null = null;
  private readonly DB_NAME = 'grovlink';

  /** Baseline schema (v1) plus every schema change shipped since. Append-only — see class doc. */
  private readonly MIGRATIONS: OtaDbMigration[] = [
    {
      version: 1,
      description: 'Baseline schema: read notifications, verse cache, class registrations, tool/plan responses, app preferences.',
      statements: [
        `CREATE TABLE IF NOT EXISTS read_notifications (
          id TEXT PRIMARY KEY,
          readAt TEXT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS verse_of_the_day_cache (
          dateKey TEXT PRIMARY KEY,
          json TEXT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS class_registrations (
          id TEXT PRIMARY KEY,
          server_id TEXT NOT NULL,
          class_id TEXT NOT NULL,
          class_title TEXT,
          class_schedule_label TEXT,
          submitted_at TEXT NOT NULL,
          payload_json TEXT NOT NULL
        );`,
        `CREATE INDEX IF NOT EXISTS idx_class_registrations_class_id
         ON class_registrations (class_id);`,
        `CREATE TABLE IF NOT EXISTS transformation_tool_responses (
          tool_id TEXT NOT NULL,
          input_key TEXT NOT NULL,
          value_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (tool_id, input_key)
        );`,
        `CREATE TABLE IF NOT EXISTS content_plan_responses (
          plan_id TEXT NOT NULL,
          input_key TEXT NOT NULL,
          value_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (plan_id, input_key)
        );`,
        `CREATE TABLE IF NOT EXISTS app_preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );`,
      ],
    },
    // Next schema change goes here as { version: 2, description: '...', statements: [...] }.
    // Additive only: ADD COLUMN / CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
  ];

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
    GrovLinkDatabaseService.sharedDb = null;
    this.db = null;
    GrovLinkDatabaseService.initPromise = null;
    await this.getDbConnection().catch(() => {});
  }

  async openDatabase(): Promise<void> {
    if (GrovLinkDatabaseService.sharedDb) {
      this.db = GrovLinkDatabaseService.sharedDb;
      return;
    }

    if (!GrovLinkDatabaseService.initPromise) {
      GrovLinkDatabaseService.initPromise = this.performOpenDatabase();
    }

    await GrovLinkDatabaseService.initPromise;

    if (GrovLinkDatabaseService.sharedDb) {
      this.db = GrovLinkDatabaseService.sharedDb;
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
        GrovLinkDatabaseService.sharedDb = this.db;
        await this.runMigrations(this.db);
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
      await this.runMigrations(this.db);
    } finally {
      GrovLinkDatabaseService.initPromise = null;
    }
  }

  /** Read `PRAGMA user_version` off the connection (0 for a brand-new, never-migrated DB). */
  private async getSchemaVersion(db: SQLiteDBConnection): Promise<number> {
    const result = await db.query('PRAGMA user_version;');
    const row = result?.values?.[0];
    if (row === undefined || row === null) return 0;
    let raw: unknown;
    if (Array.isArray(row)) {
      raw = row[0];
    } else if (typeof row === 'object' && 'user_version' in (row as Record<string, unknown>)) {
      raw = (row as Record<string, unknown>)['user_version'];
    } else {
      raw = row;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Apply every migration newer than the DB's current user_version, in order, one at a time.
   * Each migration's statements + its user_version bump run in a single transaction, so a
   * failure partway through rolls the whole step back — the DB is left at the last fully
   * applied version rather than half-migrated, and the step is retried on the next launch.
   */
  private async runMigrations(db: SQLiteDBConnection): Promise<void> {
    const currentVersion = await this.getSchemaVersion(db);
    const pending = this.MIGRATIONS.filter((m) => m.version > currentVersion).sort(
      (a, b) => a.version - b.version
    );

    for (const migration of pending) {
      try {
        await db.beginTransaction();
        for (const statement of migration.statements) {
          await db.execute(statement, false);
        }
        // PRAGMA user_version doesn't accept bound parameters; the value is our own
        // integer literal (never user input), so string interpolation here is safe.
        await db.execute(`PRAGMA user_version = ${migration.version};`, false);
        await db.commitTransaction();
      } catch (error) {
        try {
          await db.rollbackTransaction();
        } catch {
          // Rollback best-effort; the original error below is what matters.
        }
        throw new Error(
          `OTA DB migration to v${migration.version} ("${migration.description}") failed: ${
            (error as Error)?.message ?? String(error)
          }`
        );
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
   * Save a single microlearning path response for this device.
   * `inputKey` should uniquely identify the input within the plan (e.g. `${planMomentId}:${blockId}`).
   */
  async saveContentPlanResponse(
    planId: string,
    inputKey: string,
    value: string | string[]
  ): Promise<void> {
    const db = await this.getDbConnection();
    await db.run(
      `INSERT OR REPLACE INTO content_plan_responses (plan_id, input_key, value_json, updated_at)
       VALUES (?, ?, ?, ?)`,
      [planId, inputKey, JSON.stringify(value), new Date().toISOString()]
    );
  }

  /** Get all saved response values for a content plan, keyed by inputKey. */
  async getContentPlanResponses(
    planId: string
  ): Promise<Record<string, string | string[]>> {
    try {
      const db = await this.getDbConnection();
      const result = await db.query(
        'SELECT input_key, value_json FROM content_plan_responses WHERE plan_id = ?',
        [planId]
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

  /** Clear all saved responses for a content plan. */
  async clearContentPlanResponses(planId: string): Promise<void> {
    const db = await this.getDbConnection();
    await db.run('DELETE FROM content_plan_responses WHERE plan_id = ?', [planId]);
  }

  async getAppPreference(key: string): Promise<string | null> {
    const db = await this.getDbConnection();
    const result = await db.query('SELECT value FROM app_preferences WHERE key = ?', [key]);
    const row = result?.values?.[0];
    if (!row) return null;
    if (Array.isArray(row)) {
      const raw = row[0];
      return raw !== null && raw !== undefined ? String(raw) : null;
    }
    if (typeof row === 'object' && row !== null && 'value' in row) {
      const raw = (row as Record<string, unknown>)['value'];
      return raw !== null && raw !== undefined ? String(raw) : null;
    }
    return null;
  }

  async setAppPreference(key: string, value: string): Promise<void> {
    const db = await this.getDbConnection();
    await db.run('INSERT OR REPLACE INTO app_preferences (key, value) VALUES (?, ?)', [key, value]);
  }
}
