import * as i0 from '@angular/core';
import { Injectable } from '@angular/core';
import { SQLiteConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import * as i1 from '@ionic/angular';
import { format, startOfDay, addDays, differenceInDays } from 'date-fns';
import { from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Config type definitions for Simple Budget
 */
const DEFAULT_CONFIG = {
    weekStartDay: 1, // Monday
    carryForwardFlexibleTargets: true,
};

/**
 * Simple Budget Database Service
 *
 * Handles SQLite connection and schema for the simple-budget package.
 * Supports iOS, Android, and Web (via jeep-sqlite).
 */
class SimpleBudgetDatabaseService {
    platformService;
    sqlite;
    db = null;
    platform = '';
    static sharedDb = null;
    static isInitializing = false;
    DB_NAME = 'simple_budget';
    constructor(platformService) {
        this.platformService = platformService;
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }
    async initializePlugin() {
        if (this.platformService.is('ios') || this.platformService.is('android')) {
            this.platform = 'native';
        }
        else {
            this.platform = 'web';
        }
        try {
            await CapacitorSQLite.isSecretStored();
        }
        catch {
            // Plugin may not be ready on web before jeep-sqlite init
        }
        try {
            await this.sqlite.checkConnectionsConsistency();
        }
        catch {
            // Ignore
        }
        return true;
    }
    async openDatabase() {
        if (SimpleBudgetDatabaseService.isInitializing) {
            while (SimpleBudgetDatabaseService.isInitializing) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (SimpleBudgetDatabaseService.sharedDb) {
                this.db = SimpleBudgetDatabaseService.sharedDb;
                return;
            }
        }
        SimpleBudgetDatabaseService.isInitializing = true;
        try {
            try {
                this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
                if (typeof this.db.isDBOpen === 'function') {
                    const isOpen = await this.db.isDBOpen();
                    if (!isOpen)
                        await this.db.open();
                }
                SimpleBudgetDatabaseService.sharedDb = this.db;
                return;
            }
            catch {
                // No existing connection
            }
            if (this.platform === 'web') {
                await this.sqlite.saveToStore(this.DB_NAME);
            }
            try {
                this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
            }
            catch (error) {
                const msg = error?.message ?? '';
                if (msg.includes('Connection') && msg.includes('already exists')) {
                    this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
                }
                else {
                    throw error;
                }
            }
            await this.db.open();
            SimpleBudgetDatabaseService.sharedDb = this.db;
            await this.createTables();
        }
        finally {
            SimpleBudgetDatabaseService.isInitializing = false;
        }
    }
    async createTables() {
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
        }
        catch {
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
    resetConnection() {
        this.db = null;
        SimpleBudgetDatabaseService.sharedDb = null;
    }
    async getDbConnection() {
        if (!this.db) {
            await this.initializePlugin();
            await this.openDatabase();
        }
        if (!this.db) {
            throw new Error('Failed to establish database connection');
        }
        if (typeof this.db.isDBOpen === 'function') {
            const isOpen = await this.db.isDBOpen();
            if (!isOpen)
                await this.db.open();
        }
        return this.db;
    }
    async wipeAll() {
        const db = await this.getDbConnection();
        await db.execute('DELETE FROM category_instances');
        await db.execute('DELETE FROM week_plans');
        await db.execute('DELETE FROM user_category_templates');
    }
    async resetDatabase() {
        const db = await this.getDbConnection();
        await db.execute('DROP TABLE IF EXISTS category_instances');
        await db.execute('DROP TABLE IF EXISTS week_plans');
        await db.execute('DROP TABLE IF EXISTS user_category_templates');
        await this.createTables();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: SimpleBudgetDatabaseService, deps: [{ token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: SimpleBudgetDatabaseService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: SimpleBudgetDatabaseService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: i1.Platform }] });

/**
 * Pre-seeded default categories for Simple Budget
 */
const DEFAULT_INCOME_CATEGORIES = [
    { id: 'income-paycheck', name: 'Paycheck', type: 'income', sortOrder: 0 },
    { id: 'income-benefits', name: 'Benefits', type: 'income', sortOrder: 1 },
    { id: 'income-sidework', name: 'Side work', type: 'income', sortOrder: 2 },
    { id: 'income-other', name: 'Other', type: 'income', sortOrder: 3 },
];
const DEFAULT_BILLS_CATEGORIES = [
    { id: 'bills-rent', name: 'Rent or mortgage', type: 'bills', sortOrder: 0 },
    { id: 'bills-electric', name: 'Electric', type: 'bills', sortOrder: 1 },
    { id: 'bills-gas', name: 'Gas utility', type: 'bills', sortOrder: 2 },
    { id: 'bills-water', name: 'Water', type: 'bills', sortOrder: 3 },
    { id: 'bills-phone', name: 'Phone', type: 'bills', sortOrder: 4 },
    { id: 'bills-internet', name: 'Internet', type: 'bills', sortOrder: 5 },
    { id: 'bills-insurance', name: 'Insurance', type: 'bills', sortOrder: 6 },
    { id: 'bills-debt', name: 'Debt payment', type: 'bills', sortOrder: 7 },
    { id: 'bills-childcare', name: 'Childcare', type: 'bills', sortOrder: 8 },
    { id: 'bills-other', name: 'Other', type: 'bills', sortOrder: 9 },
];
const DEFAULT_FLEXIBLE_CATEGORIES = [
    { id: 'flex-groceries', name: 'Groceries', type: 'flexible', sortOrder: 0 },
    { id: 'flex-gas', name: 'Gas for car', type: 'flexible', sortOrder: 1 },
    { id: 'flex-household', name: 'Household', type: 'flexible', sortOrder: 2 },
    { id: 'flex-medical', name: 'Medical', type: 'flexible', sortOrder: 3 },
    { id: 'flex-personal', name: 'Personal', type: 'flexible', sortOrder: 4 },
    { id: 'flex-other', name: 'Other', type: 'flexible', sortOrder: 5 },
];
const ALL_DEFAULT_CATEGORIES = [
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_BILLS_CATEGORIES,
    ...DEFAULT_FLEXIBLE_CATEGORIES,
];

class WeekPlanService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listWeeks() {
        const conn = await this.db.getDbConnection();
        const rows = await conn.query('SELECT * FROM week_plans ORDER BY week_start_date DESC');
        const plans = [];
        for (const r of rows.values ?? []) {
            const plan = await this.hydrateWeekPlan(r);
            if (plan)
                plans.push(plan);
        }
        return plans;
    }
    /**
     * Get all week plans that fall within a given month (YYYY-MM).
     * Weeks are ordered by week_start_date ascending.
     */
    async getWeeksForMonth(monthKey) {
        const plans = await this.listWeeks();
        const [year, month] = monthKey.split('-').map(Number);
        return plans
            .filter((p) => {
            const [py, pm] = p.weekStartDate.split('-').map(Number);
            return py === year && pm === month;
        })
            .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
    }
    /**
     * Returns distinct month keys (YYYY-MM) that have at least one week plan.
     * Always includes the current month.
     */
    async getMonthsWithEntries() {
        const plans = await this.listWeeks();
        const monthSet = new Set();
        const now = new Date();
        const currentMonth = format(now, 'yyyy-MM');
        monthSet.add(currentMonth);
        for (const p of plans) {
            const [y, m] = p.weekStartDate.split('-');
            monthSet.add(`${y}-${m}`);
        }
        return [...monthSet]
            .sort((a, b) => b.localeCompare(a))
            .map((key) => {
            const [y, m] = key.split('-').map(Number);
            const d = new Date(y, m - 1, 1);
            return { key, label: format(d, 'MMM yyyy') };
        });
    }
    async getWeek(id) {
        const conn = await this.db.getDbConnection();
        const rows = await conn.query('SELECT * FROM week_plans WHERE id = ?', [id]);
        const r = (rows.values ?? [])[0];
        return r ? this.hydrateWeekPlan(r) : null;
    }
    async getWeekByDate(weekStartDate) {
        const conn = await this.db.getDbConnection();
        const rows = await conn.query('SELECT * FROM week_plans WHERE week_start_date = ?', [weekStartDate]);
        const r = (rows.values ?? [])[0];
        return r ? this.hydrateWeekPlan(r) : null;
    }
    async getOrCreateCurrentWeek(config = DEFAULT_CONFIG) {
        const weekStart = this.getWeekStartForDate(new Date(), config.weekStartDay);
        const existing = await this.getWeekByDate(weekStart);
        if (existing)
            return existing;
        return this.createWeek(weekStart, config);
    }
    getWeekStartForDate(date, weekStartDay) {
        const d = startOfDay(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const target = days[weekStartDay] ?? 'Monday';
        let start = d;
        while (format(start, 'EEEE') !== target) {
            start = addDays(start, -1);
        }
        return format(start, 'yyyy-MM-dd');
    }
    async createWeek(weekStartDate, _config = DEFAULT_CONFIG) {
        const now = new Date().toISOString();
        const conn = await this.db.getDbConnection();
        const result = await conn.run(`INSERT INTO week_plans (week_start_date, starting_balance, notes, status, created_at, updated_at)
       VALUES (?, 0, ?, 'draft', ?, ?)`, [weekStartDate, 'Practice, not perfection.', now, now]);
        const id = result.changes?.lastId ?? 0;
        return (await this.getWeek(id));
    }
    async getOrCreateWeekByDate(weekStartDate, config = DEFAULT_CONFIG) {
        const existing = await this.getWeekByDate(weekStartDate);
        if (existing)
            return existing;
        return this.createWeek(weekStartDate, config);
    }
    async getUserCategoryTemplates() {
        const conn = await this.db.getDbConnection();
        const rows = await conn.query('SELECT name, type FROM user_category_templates ORDER BY name');
        return (rows.values ?? []).map((r) => {
            const row = r;
            return {
                name: row['name'],
                type: row['type'],
            };
        });
    }
    async addUserCategoryTemplate(name, type) {
        const trimmed = name.trim();
        if (!trimmed)
            return;
        const conn = await this.db.getDbConnection();
        try {
            await conn.run('INSERT OR IGNORE INTO user_category_templates (name, type, created_at) VALUES (?, ?, ?)', [trimmed, type, new Date().toISOString()]);
        }
        catch {
            // Ignore duplicate
        }
    }
    async getSuggestedCategoryNames(type) {
        const fromDefaults = ALL_DEFAULT_CATEGORIES
            .filter((t) => t.type === type)
            .map((t) => t.name);
        const userTemplates = (await this.getUserCategoryTemplates())
            .filter((t) => t.type === type)
            .map((t) => t.name);
        return [...new Set([...fromDefaults, ...userTemplates])].sort();
    }
    async upsertWeek(plan) {
        const now = new Date().toISOString();
        const conn = await this.db.getDbConnection();
        if (plan.id) {
            await conn.run(`UPDATE week_plans SET
          starting_balance = ?, notes = ?, strategy_notes = ?,
          review_what_changed = ?, review_new_money = ?, review_bills_higher = ?, review_notes = ?,
          status = ?, updated_at = ?
         WHERE id = ?`, [
                plan.startingBalance,
                plan.notes ?? null,
                plan.strategyNotes ?? null,
                plan.reviewWhatChanged ?? null,
                plan.reviewNewMoney ?? null,
                plan.reviewBillsHigher ?? null,
                plan.reviewNotes ?? null,
                plan.status ?? 'draft',
                now,
                plan.id,
            ]);
            await conn.run('DELETE FROM category_instances WHERE week_plan_id = ?', [
                plan.id,
            ]);
        }
        else {
            const result = await conn.run(`INSERT INTO week_plans (week_start_date, starting_balance, notes, strategy_notes, review_what_changed, review_new_money, review_bills_higher, review_notes, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                plan.weekStartDate,
                plan.startingBalance,
                plan.notes ?? null,
                plan.strategyNotes ?? null,
                plan.reviewWhatChanged ?? null,
                plan.reviewNewMoney ?? null,
                plan.reviewBillsHigher ?? null,
                plan.reviewNotes ?? null,
                plan.status ?? 'draft',
                now,
                now,
            ]);
            plan.id = result.changes?.lastId ?? 0;
        }
        for (const c of plan.categoryInstances) {
            await conn.run(`INSERT INTO category_instances (week_plan_id, name, type, amount, visible, is_custom, sort_order, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                plan.id,
                c.name,
                c.type,
                c.amount ?? 0,
                c.visible !== false ? 1 : 0,
                c.isCustom ? 1 : 0,
                c.sortOrder ?? 0,
                c.notes ?? null,
                now,
                now,
            ]);
        }
        return (await this.getWeek(plan.id));
    }
    async copyToNextWeek(sourcePlan, config = DEFAULT_CONFIG) {
        const nextStart = format(addDays(new Date(sourcePlan.weekStartDate + 'T00:00:00'), 7), 'yyyy-MM-dd');
        const existing = await this.getWeekByDate(nextStart);
        if (existing)
            return existing;
        const now = new Date().toISOString();
        const conn = await this.db.getDbConnection();
        const result = await conn.run(`INSERT INTO week_plans (week_start_date, starting_balance, notes, status, created_at, updated_at)
       VALUES (?, 0, ?, 'draft', ?, ?)`, [nextStart, null, now, now]);
        const newId = result.changes?.lastId ?? 0;
        let sortOrder = 0;
        for (const c of sourcePlan.categoryInstances) {
            const amount = config.carryForwardFlexibleTargets && c.type === 'flexible'
                ? c.amount
                : 0;
            await conn.run(`INSERT INTO category_instances (week_plan_id, name, type, amount, visible, is_custom, sort_order, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                newId,
                c.name,
                c.type,
                c.type === 'income' || c.type === 'bills' ? 0 : amount,
                c.visible !== false ? 1 : 0,
                c.isCustom ? 1 : 0,
                sortOrder++,
                c.notes ?? null,
                now,
                now,
            ]);
        }
        return (await this.getWeek(newId));
    }
    async hydrateWeekPlan(row) {
        const id = row['id'];
        const conn = await this.db.getDbConnection();
        const catRows = await conn.query('SELECT * FROM category_instances WHERE week_plan_id = ? ORDER BY sort_order, id', [id]);
        const categoryInstances = (catRows.values ?? []).map((r) => {
            const c = r;
            return {
                id: c['id'],
                weekPlanId: c['week_plan_id'],
                name: c['name'],
                type: c['type'],
                amount: c['amount'] ?? 0,
                visible: c['visible'] !== 0,
                isCustom: c['is_custom'] !== 0,
                sortOrder: c['sort_order'] ?? 0,
                notes: c['notes'],
            };
        });
        return {
            id,
            weekStartDate: row['week_start_date'],
            startingBalance: row['starting_balance'] ?? 0,
            categoryInstances,
            notes: row['notes'],
            strategyNotes: row['strategy_notes'],
            reviewWhatChanged: row['review_what_changed'],
            reviewNewMoney: row['review_new_money'],
            reviewBillsHigher: row['review_bills_higher'],
            reviewNotes: row['review_notes'],
            createdAt: row['created_at'],
            updatedAt: row['updated_at'],
            status: row['status'] ?? 'draft',
        };
    }
    getDefaultTemplates() {
        return ALL_DEFAULT_CATEGORIES;
    }
    /**
     * Seeds 3 months of budget data (Jan, Feb, Mar 2026) with realistic sample entries.
     * Uses Monday as week start. Overwrites any existing plans for those weeks.
     */
    async seedBudgetData() {
        // Use Sunday-based weeks to match the app's week scroller (getSundayForDate)
        // Start from week containing Jan 1, 2026 (Sun Dec 28, 2025 – Jan 3, 2026)
        const weekDates = [
            '2025-12-28',
            '2026-01-04',
            '2026-01-11',
            '2026-01-18',
            '2026-01-25',
            '2026-02-01',
            '2026-02-08',
            '2026-02-15',
            '2026-02-22',
            '2026-03-01',
            '2026-03-08',
        ];
        const baseIncome = [
            { name: 'Paycheck', amount: 2400, notes: 'Bi-weekly direct deposit from main employer.' },
            { name: 'Benefits', amount: 0, notes: '' },
            { name: 'Side work', amount: 150, notes: 'Freelance project, due end of week.' },
            { name: 'Other', amount: 0, notes: '' },
        ];
        const baseBills = [
            { name: 'Rent or mortgage', amount: 1150, notes: 'Due on the 1st, paid early this month.' },
            { name: 'Electric', amount: 85, notes: '' },
            { name: 'Gas utility', amount: 45, notes: 'Winter rate.' },
            { name: 'Water', amount: 55, notes: '' },
            { name: 'Phone', amount: 75, notes: 'Family plan.' },
            { name: 'Internet', amount: 60, notes: '' },
            { name: 'Insurance', amount: 145, notes: 'Auto + renters.' },
            { name: 'Debt payment', amount: 200, notes: 'Credit card minimum + extra.' },
            { name: 'Childcare', amount: 0, notes: '' },
            { name: 'Other', amount: 0, notes: '' },
        ];
        const baseFlexible = [
            { name: 'Groceries', amount: 380, notes: 'Includes household and personal care.' },
            { name: 'Gas for car', amount: 90, notes: '' },
            { name: 'Household', amount: 50, notes: 'Cleaning supplies, paper goods.' },
            { name: 'Medical', amount: 30, notes: 'Prescription copays.' },
            { name: 'Personal', amount: 75, notes: '' },
            { name: 'Other', amount: 50, notes: '' },
        ];
        const variance = (base, pct, seed) => Math.round(base * (1 + ((seed % 100) / 100 - 0.5) * pct));
        for (let i = 0; i < weekDates.length; i++) {
            const weekStart = weekDates[i];
            const plan = await this.getOrCreateWeekByDate(weekStart, DEFAULT_CONFIG);
            const categoryInstances = [
                ...baseIncome.map((c, j) => ({
                    weekPlanId: plan.id,
                    name: c.name,
                    type: 'income',
                    amount: j === 0 ? variance(c.amount, 0.05, i * 7 + 1) : c.amount,
                    visible: true,
                    isCustom: false,
                    sortOrder: j,
                    notes: c.notes || undefined,
                })),
                ...baseBills.map((c, j) => ({
                    weekPlanId: plan.id,
                    name: c.name,
                    type: 'bills',
                    amount: c.amount > 0 ? variance(c.amount, 0.08, i * 11 + j) : 0,
                    visible: true,
                    isCustom: false,
                    sortOrder: baseIncome.length + j,
                    notes: c.notes || undefined,
                })),
                ...baseFlexible.map((c, j) => ({
                    weekPlanId: plan.id,
                    name: c.name,
                    type: 'flexible',
                    amount: variance(c.amount, 0.12, i * 13 + j),
                    visible: true,
                    isCustom: false,
                    sortOrder: baseIncome.length + baseBills.length + j,
                    notes: c.notes || undefined,
                })),
            ];
            const startingBalance = i === 0 ? 350 : variance(200, 0.3, i);
            await this.upsertWeek({
                ...plan,
                startingBalance,
                categoryInstances,
                status: 'saved',
            });
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: WeekPlanService, deps: [{ token: SimpleBudgetDatabaseService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: WeekPlanService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: WeekPlanService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: SimpleBudgetDatabaseService }] });

/**
 * Pure function to calculate week summary from a week plan
 */
function calculateWeekSummary(weekPlan, asOfDate // YYYY-MM-DD, defaults to today
) {
    const visible = (c) => c.visible;
    const income = weekPlan.categoryInstances
        .filter((c) => c.type === 'income' && visible(c))
        .reduce((sum, c) => sum + (c.amount || 0), 0);
    const bills = weekPlan.categoryInstances
        .filter((c) => c.type === 'bills' && visible(c))
        .reduce((sum, c) => sum + (c.amount || 0), 0);
    const flexible = weekPlan.categoryInstances
        .filter((c) => c.type === 'flexible' && visible(c))
        .reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalAvailable = weekPlan.startingBalance + income;
    const totalBills = bills;
    const totalFlexible = flexible;
    const remaining = totalAvailable - totalBills - totalFlexible;
    const weekStart = new Date(weekPlan.weekStartDate + 'T00:00:00');
    const weekEnd = addDays(weekStart, 6);
    const today = asOfDate
        ? new Date(asOfDate + 'T00:00:00')
        : startOfDay(new Date());
    const daysLeftInWeek = today > weekEnd
        ? 0
        : today < weekStart
            ? 7
            : Math.min(7, differenceInDays(weekEnd, today) + 1);
    const safeToSpendPerDay = daysLeftInWeek > 0 ? Math.round((remaining / daysLeftInWeek) * 100) / 100 : 0;
    return {
        totalAvailable,
        totalBills,
        totalFlexible,
        remaining,
        daysLeftInWeek,
        safeToSpendPerDay,
        isOverPlan: remaining < 0,
    };
}

/**
 * Service for exposing Simple Budget data to the host app (e.g. home page widget).
 * Returns current week snapshot only when user has data; null otherwise.
 */
class SimpleBudgetHomeService {
    weekPlanService;
    constructor(weekPlanService) {
        this.weekPlanService = weekPlanService;
    }
    /**
     * Gets the current week's budget snapshot for display on the home page.
     * Returns null if no plan exists for the current week.
     */
    getCurrentWeekSnapshot() {
        return from(this.fetchSnapshot()).pipe(catchError(() => of(null)));
    }
    async fetchSnapshot() {
        const weekStart = this.weekPlanService.getWeekStartForDate(new Date(), DEFAULT_CONFIG.weekStartDay);
        const plan = await this.weekPlanService.getWeekByDate(weekStart);
        if (!plan)
            return null;
        const summary = calculateWeekSummary(plan);
        return { plan, summary };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: SimpleBudgetHomeService, deps: [{ token: WeekPlanService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: SimpleBudgetHomeService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: SimpleBudgetHomeService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: WeekPlanService }] });

/**
 * Export utilities for Simple Budget - JSON and CSV
 */
function buildExportRows(plan, summary) {
    const weekEnd = new Date(plan.weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const dateRange = `${plan.weekStartDate} – ${format(weekEnd, 'yyyy-MM-dd')}`;
    return [
        { label: 'Week of', value: dateRange },
        { label: 'Starting balance', value: plan.startingBalance },
        { label: 'Total income', value: summary.totalAvailable - plan.startingBalance },
        { label: 'Money available', value: summary.totalAvailable },
        { label: 'Bills due', value: summary.totalBills },
        { label: 'Flexible targets', value: summary.totalFlexible },
        { label: 'Remaining', value: summary.remaining },
        { label: 'Safe to spend per day', value: summary.safeToSpendPerDay },
        { label: 'Days left in week', value: summary.daysLeftInWeek },
    ];
}
function exportToJson(plan, summary) {
    const rows = buildExportRows(plan, summary);
    const summaryObj = {};
    for (const r of rows)
        summaryObj[r.label] = r.value;
    const obj = {
        weekStartDate: plan.weekStartDate,
        exportedAt: new Date().toISOString(),
        summary: summaryObj,
        categories: plan.categoryInstances
            .filter((c) => c.visible)
            .map((c) => ({ name: c.name, type: c.type, amount: c.amount })),
    };
    return JSON.stringify(obj, null, 2);
}
function exportToCsv(plan, summary) {
    const rows = buildExportRows(plan, summary);
    const lines = rows.map((r) => `"${r.label}","${r.value}"`);
    return 'Label,Value\n' + lines.join('\n');
}

/**
 * Quick Adjust checklist options (suggestions only, not auto-edits)
 */
const QUICK_ADJUST_OPTIONS = [
    { id: 'reduce-flexible', label: 'Reduce flexible spending targets' },
    { id: 'delay-bill', label: 'Delay a bill payment to next week' },
    { id: 'extra-income', label: 'Look for extra income (side work, gig)' },
    { id: 'cut-nonessential', label: 'Cut non-essential items' },
    { id: 'ask-help', label: 'Ask for help or payment plan' },
];

/**
 * Generated bundle index. Do not edit.
 */

export { ALL_DEFAULT_CATEGORIES, DEFAULT_CONFIG, QUICK_ADJUST_OPTIONS, SimpleBudgetDatabaseService, SimpleBudgetHomeService, WeekPlanService, buildExportRows, calculateWeekSummary, exportToCsv, exportToJson };
//# sourceMappingURL=simple-budget.mjs.map
