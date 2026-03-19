import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';
import * as i0 from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Category type definitions for Simple Budget
 */
type CategoryType = 'income' | 'bills' | 'flexible';
/** Pre-seeded template category (used for default category list) */
interface CategoryTemplate {
    id: string;
    name: string;
    type: CategoryType;
    sortOrder: number;
}
/** Category instance for a specific week (can be hidden, custom) */
interface CategoryInstance {
    id?: number;
    weekPlanId: number;
    name: string;
    type: CategoryType;
    amount: number;
    /** Hidden for this week only (not deleted) */
    visible: boolean;
    /** User-added custom category (not from template) */
    isCustom: boolean;
    sortOrder: number;
    /** Optional notes for this entry */
    notes?: string;
}

/**
 * Week plan type definitions for Simple Budget
 */

type WeekPlanStatus = 'draft' | 'saved';
interface WeekPlan {
    id?: number;
    weekStartDate: string;
    startingBalance: number;
    categoryInstances: CategoryInstance[];
    notes?: string;
    /** Quick Adjust strategy notes (1-3 selected items) */
    strategyNotes?: string;
    /** Weekly Review prompts */
    reviewWhatChanged?: string;
    reviewNewMoney?: string;
    reviewBillsHigher?: string;
    reviewNotes?: string;
    createdAt: string;
    updatedAt: string;
    status: WeekPlanStatus;
}
interface WeekSummary {
    totalAvailable: number;
    totalBills: number;
    totalFlexible: number;
    remaining: number;
    daysLeftInWeek: number;
    safeToSpendPerDay: number;
    isOverPlan: boolean;
}
interface ExportRow {
    label: string;
    value: string | number;
}

/**
 * Config type definitions for Simple Budget
 */
interface SimpleBudgetConfig {
    /** Week start day: 0 = Sunday, 1 = Monday, etc. */
    weekStartDay: number;
    /** Carry forward flexible targets when copying to next week */
    carryForwardFlexibleTargets: boolean;
}
declare const DEFAULT_CONFIG: SimpleBudgetConfig;

/**
 * Simple Budget Database Service
 *
 * Handles SQLite connection and schema for the simple-budget package.
 * Supports iOS, Android, and Web (via jeep-sqlite).
 */
declare class SimpleBudgetDatabaseService {
    private platformService;
    private sqlite;
    private db;
    private platform;
    private static sharedDb;
    private static isInitializing;
    private readonly DB_NAME;
    constructor(platformService: Platform);
    initializePlugin(): Promise<boolean>;
    openDatabase(): Promise<void>;
    private createTables;
    resetConnection(): void;
    getDbConnection(): Promise<SQLiteDBConnection>;
    wipeAll(): Promise<void>;
    resetDatabase(): Promise<void>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SimpleBudgetDatabaseService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SimpleBudgetDatabaseService>;
}

declare class WeekPlanService {
    private db;
    constructor(db: SimpleBudgetDatabaseService);
    listWeeks(): Promise<WeekPlan[]>;
    /**
     * Get all week plans that fall within a given month (YYYY-MM).
     * Weeks are ordered by week_start_date ascending.
     */
    getWeeksForMonth(monthKey: string): Promise<WeekPlan[]>;
    /**
     * Returns distinct month keys (YYYY-MM) that have at least one week plan.
     * Always includes the current month.
     */
    getMonthsWithEntries(): Promise<{
        key: string;
        label: string;
    }[]>;
    getWeek(id: number): Promise<WeekPlan | null>;
    getWeekByDate(weekStartDate: string): Promise<WeekPlan | null>;
    getOrCreateCurrentWeek(config?: SimpleBudgetConfig): Promise<WeekPlan>;
    getWeekStartForDate(date: Date, weekStartDay: number): string;
    createWeek(weekStartDate: string, _config?: SimpleBudgetConfig): Promise<WeekPlan>;
    getOrCreateWeekByDate(weekStartDate: string, config?: SimpleBudgetConfig): Promise<WeekPlan>;
    getUserCategoryTemplates(): Promise<{
        name: string;
        type: CategoryInstance['type'];
    }[]>;
    addUserCategoryTemplate(name: string, type: CategoryInstance['type']): Promise<void>;
    getSuggestedCategoryNames(type: CategoryInstance['type']): Promise<string[]>;
    upsertWeek(plan: WeekPlan): Promise<WeekPlan>;
    copyToNextWeek(sourcePlan: WeekPlan, config?: SimpleBudgetConfig): Promise<WeekPlan>;
    private hydrateWeekPlan;
    getDefaultTemplates(): CategoryTemplate[];
    /**
     * Seeds 3 months of budget data (Jan, Feb, Mar 2026) with realistic sample entries.
     * Uses Monday as week start. Overwrites any existing plans for those weeks.
     */
    seedBudgetData(): Promise<void>;
    static ɵfac: i0.ɵɵFactoryDeclaration<WeekPlanService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<WeekPlanService>;
}

/**
 * Snapshot of current week budget data for home page widget.
 * Returned when user has a week plan for the current week.
 */
interface SimpleBudgetHomeSnapshot {
    plan: WeekPlan;
    summary: WeekSummary;
}
/**
 * Service for exposing Simple Budget data to the host app (e.g. home page widget).
 * Returns current week snapshot only when user has data; null otherwise.
 */
declare class SimpleBudgetHomeService {
    private weekPlanService;
    constructor(weekPlanService: WeekPlanService);
    /**
     * Gets the current week's budget snapshot for display on the home page.
     * Returns null if no plan exists for the current week.
     */
    getCurrentWeekSnapshot(): Observable<SimpleBudgetHomeSnapshot | null>;
    private fetchSnapshot;
    static ɵfac: i0.ɵɵFactoryDeclaration<SimpleBudgetHomeService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SimpleBudgetHomeService>;
}

/**
 * Pure function to calculate week summary from a week plan
 */

declare function calculateWeekSummary(weekPlan: WeekPlan, asOfDate?: string): WeekSummary;

/**
 * Export utilities for Simple Budget - JSON and CSV
 */

declare function buildExportRows(plan: WeekPlan, summary: WeekSummary): ExportRow[];
declare function exportToJson(plan: WeekPlan, summary: WeekSummary): string;
declare function exportToCsv(plan: WeekPlan, summary: WeekSummary): string;

/**
 * Quick Adjust checklist options (suggestions only, not auto-edits)
 */
interface QuickAdjustOption {
    id: string;
    label: string;
}
declare const QUICK_ADJUST_OPTIONS: QuickAdjustOption[];

/**
 * Pre-seeded default categories for Simple Budget
 */

declare const ALL_DEFAULT_CATEGORIES: CategoryTemplate[];

export { ALL_DEFAULT_CATEGORIES, DEFAULT_CONFIG, QUICK_ADJUST_OPTIONS, SimpleBudgetDatabaseService, SimpleBudgetHomeService, WeekPlanService, buildExportRows, calculateWeekSummary, exportToCsv, exportToJson };
export type { CategoryInstance, CategoryTemplate, CategoryType, ExportRow, QuickAdjustOption, SimpleBudgetConfig, SimpleBudgetHomeSnapshot, WeekPlan, WeekPlanStatus, WeekSummary };
