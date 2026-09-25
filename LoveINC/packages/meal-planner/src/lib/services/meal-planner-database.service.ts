import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerDatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private platform = '';
  private static sharedDb: SQLiteDBConnection | null = null;
  private static initPromise: Promise<void> | null = null;
  private readonly DB_NAME = 'meal_planner';

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
    if (Capacitor.isNativePlatform()) {
      try {
        const { result } = await this.sqlite.checkConnectionsConsistency();
        if (result === false) {
          this.resetConnection();
          MealPlannerDatabaseService.initPromise = null;
        }
      } catch {
        this.resetConnection();
        MealPlannerDatabaseService.initPromise = null;
      }
    }
    return true;
  }

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
    MealPlannerDatabaseService.initPromise = null;
    await this.getDbConnection().catch(() => {});
  }

  async openDatabase(): Promise<void> {
    if (MealPlannerDatabaseService.sharedDb) {
      this.db = MealPlannerDatabaseService.sharedDb;
      return;
    }

    if (!MealPlannerDatabaseService.initPromise) {
      MealPlannerDatabaseService.initPromise = this.performOpenDatabase();
    }

    await MealPlannerDatabaseService.initPromise;

    if (MealPlannerDatabaseService.sharedDb) {
      this.db = MealPlannerDatabaseService.sharedDb;
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
        MealPlannerDatabaseService.sharedDb = this.db;
        await this.createTables();
        return;
      } catch {
        this.db = null;
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
      MealPlannerDatabaseService.sharedDb = this.db;
      await this.createTables();
    } catch (err) {
      this.resetConnection();
      MealPlannerDatabaseService.initPromise = null;
      throw err;
    } finally {
      MealPlannerDatabaseService.initPromise = null;
    }
  }

  private async createTables(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS meal_planner_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        household_size INTEGER NOT NULL DEFAULT 2,
        max_ready_minutes INTEGER NOT NULL DEFAULT 45,
        updated_at TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cached_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spoonacular_id INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        image_url TEXT,
        ready_in_minutes INTEGER,
        servings INTEGER NOT NULL DEFAULT 4,
        ingredients_json TEXT NOT NULL,
        instructions_json TEXT NOT NULL,
        source_url TEXT,
        cached_at TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS favorite_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cached_recipe_id INTEGER NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        FOREIGN KEY (cached_recipe_id) REFERENCES cached_recipes(id) ON DELETE CASCADE
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS weekly_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start_date TEXT NOT NULL UNIQUE,
        week_serving_delta INTEGER NOT NULL DEFAULT 0,
        week_note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS plan_meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekly_plan_id INTEGER NOT NULL,
        cached_recipe_id INTEGER NOT NULL,
        slot_index INTEGER NOT NULL,
        extra_guests INTEGER NOT NULL DEFAULT 0,
        event_note TEXT,
        is_cooked INTEGER NOT NULL DEFAULT 0,
        cook_time_bucket TEXT,
        reaction_emoji TEXT,
        cooked_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (cached_recipe_id) REFERENCES cached_recipes(id),
        UNIQUE(weekly_plan_id, slot_index)
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS grocery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekly_plan_id INTEGER NOT NULL,
        aisle TEXT NOT NULL,
        ingredient_name TEXT NOT NULL,
        amount_text TEXT NOT NULL,
        is_checked INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE
      );
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_plan_meals_week
      ON plan_meals(weekly_plan_id);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_grocery_items_week
      ON grocery_items(weekly_plan_id);
    `);
    await this.migrateTables(db);
  }

  private async migrateTables(db: SQLiteDBConnection): Promise<void> {
    await this.addColumnIfMissing(db, 'plan_meals', 'actual_cook_minutes', 'INTEGER');
    await this.addColumnIfMissing(db, 'plan_meals', 'complexity', 'TEXT');
    await this.addColumnIfMissing(db, 'grocery_items', 'is_manual', 'INTEGER DEFAULT 0');
    await this.addColumnIfMissing(db, 'grocery_items', 'image_url', 'TEXT');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS grocery_item_exclusions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekly_plan_id INTEGER NOT NULL,
        ingredient_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
        UNIQUE(weekly_plan_id, ingredient_key)
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ingredient_images (
        name_key TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
    `);
  }

  private async addColumnIfMissing(
    db: SQLiteDBConnection,
    table: string,
    column: string,
    type: string
  ): Promise<void> {
    const result = await db.query(`PRAGMA table_info(${table})`);
    const exists = (result.values ?? []).some((row) => String(row['name']) === column);
    if (!exists) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }

  resetConnection(): void {
    this.db = null;
    MealPlannerDatabaseService.sharedDb = null;
  }

  async getDbConnection(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      await this.initializePlugin();
      await this.openDatabase();
    }
    if (!this.db) {
      throw new Error('Failed to establish database connection');
    }
    try {
      await this.ensureDbOpen(this.db);
      return this.db;
    } catch {
      this.resetConnection();
      MealPlannerDatabaseService.initPromise = null;
      await this.openDatabase();
      if (!this.db) {
        throw new Error('Failed to establish database connection');
      }
      await this.ensureDbOpen(this.db);
      return this.db;
    }
  }

  private async ensureDbOpen(db: SQLiteDBConnection): Promise<void> {
    if (typeof db.isDBOpen !== 'function') {
      return;
    }
    const isOpen = await db.isDBOpen();
    if (!isOpen) {
      await db.open();
    }
  }

  async wipeAll(): Promise<void> {
    const db = await this.getDbConnection();
    await db.execute('DELETE FROM grocery_item_exclusions');
    await db.execute('DELETE FROM grocery_items');
    await db.execute('DELETE FROM ingredient_images');
    await db.execute('DELETE FROM plan_meals');
    await db.execute('DELETE FROM weekly_plans');
    await db.execute('DELETE FROM favorite_recipes');
    await db.execute('DELETE FROM cached_recipes');
    await db.execute('DELETE FROM meal_planner_profile');
  }
}
