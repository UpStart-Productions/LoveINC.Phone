import { Injectable } from '@angular/core';
import type { WeekPlan } from '../types/week-plan.types';
import type { CategoryInstance } from '../types/category.types';
import type { CategoryTemplate } from '../types/category.types';
import type { SimpleBudgetConfig } from '../types/config.types';
import { DEFAULT_CONFIG } from '../types/config.types';
import { ALL_DEFAULT_CATEGORIES } from '../constants/default-categories';
import { SimpleBudgetDatabaseService } from './simple-budget-database.service';
import { addDays, format, startOfDay } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class WeekPlanService {
  constructor(private db: SimpleBudgetDatabaseService) {}

  async listWeeks(): Promise<WeekPlan[]> {
    const conn = await this.db.getDbConnection();
    const rows = await conn.query(
      'SELECT * FROM week_plans ORDER BY week_start_date DESC'
    );
    const plans: WeekPlan[] = [];
    for (const r of rows.values ?? []) {
      const plan = await this.hydrateWeekPlan(r as Record<string, unknown>);
      if (plan) plans.push(plan);
    }
    return plans;
  }

  /**
   * Get all week plans that fall within a given month (YYYY-MM).
   * Weeks are ordered by week_start_date ascending.
   */
  async getWeeksForMonth(monthKey: string): Promise<WeekPlan[]> {
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
  async getMonthsWithEntries(): Promise<{ key: string; label: string }[]> {
    const plans = await this.listWeeks();
    const monthSet = new Set<string>();
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

  async getWeek(id: number): Promise<WeekPlan | null> {
    const conn = await this.db.getDbConnection();
    const rows = await conn.query('SELECT * FROM week_plans WHERE id = ?', [id]);
    const r = (rows.values ?? [])[0] as Record<string, unknown> | undefined;
    return r ? this.hydrateWeekPlan(r) : null;
  }

  async getWeekByDate(weekStartDate: string): Promise<WeekPlan | null> {
    const conn = await this.db.getDbConnection();
    const rows = await conn.query(
      'SELECT * FROM week_plans WHERE week_start_date = ?',
      [weekStartDate]
    );
    const r = (rows.values ?? [])[0] as Record<string, unknown> | undefined;
    return r ? this.hydrateWeekPlan(r) : null;
  }

  async getOrCreateCurrentWeek(
    config: SimpleBudgetConfig = DEFAULT_CONFIG
  ): Promise<WeekPlan> {
    const weekStart = this.getWeekStartForDate(new Date(), config.weekStartDay);
    const existing = await this.getWeekByDate(weekStart);
    if (existing) return existing;
    return this.createWeek(weekStart, config);
  }

  getWeekStartForDate(date: Date, weekStartDay: number): string {
    const d = startOfDay(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const target = days[weekStartDay] ?? 'Monday';
    let start = d;
    while (format(start, 'EEEE') !== target) {
      start = addDays(start, -1);
    }
    return format(start, 'yyyy-MM-dd');
  }

  async createWeek(
    weekStartDate: string,
    _config: SimpleBudgetConfig = DEFAULT_CONFIG
  ): Promise<WeekPlan> {
    const now = new Date().toISOString();
    const conn = await this.db.getDbConnection();
    const result = await conn.run(
      `INSERT INTO week_plans (week_start_date, starting_balance, notes, status, created_at, updated_at)
       VALUES (?, 0, ?, 'draft', ?, ?)`,
      [weekStartDate, 'Practice, not perfection.', now, now]
    );
    const id = result.changes?.lastId ?? 0;
    return (await this.getWeek(id))!;
  }

  async getOrCreateWeekByDate(
    weekStartDate: string,
    config: SimpleBudgetConfig = DEFAULT_CONFIG
  ): Promise<WeekPlan> {
    const existing = await this.getWeekByDate(weekStartDate);
    if (existing) return existing;
    return this.createWeek(weekStartDate, config);
  }

  async getUserCategoryTemplates(): Promise<{ name: string; type: CategoryInstance['type'] }[]> {
    const conn = await this.db.getDbConnection();
    const rows = await conn.query(
      'SELECT name, type FROM user_category_templates ORDER BY name'
    );
    return (rows.values ?? []).map((r: unknown) => {
      const row = r as Record<string, unknown>;
      return {
        name: row['name'] as string,
        type: row['type'] as 'income' | 'bills' | 'flexible',
      };
    });
  }

  async addUserCategoryTemplate(
    name: string,
    type: CategoryInstance['type']
  ): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const conn = await this.db.getDbConnection();
    try {
      await conn.run(
        'INSERT OR IGNORE INTO user_category_templates (name, type, created_at) VALUES (?, ?, ?)',
        [trimmed, type, new Date().toISOString()]
      );
    } catch {
      // Ignore duplicate
    }
  }

  async getSuggestedCategoryNames(
    type: CategoryInstance['type']
  ): Promise<string[]> {
    const fromDefaults = ALL_DEFAULT_CATEGORIES
      .filter((t) => t.type === type)
      .map((t) => t.name);
    const userTemplates = (await this.getUserCategoryTemplates())
      .filter((t) => t.type === type)
      .map((t) => t.name);
    return [...new Set([...fromDefaults, ...userTemplates])].sort();
  }

  async upsertWeek(plan: WeekPlan): Promise<WeekPlan> {
    const now = new Date().toISOString();
    const conn = await this.db.getDbConnection();

    if (plan.id) {
      await conn.run(
        `UPDATE week_plans SET
          starting_balance = ?, notes = ?, strategy_notes = ?,
          review_what_changed = ?, review_new_money = ?, review_bills_higher = ?, review_notes = ?,
          status = ?, updated_at = ?
         WHERE id = ?`,
        [
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
        ]
      );
      await conn.run('DELETE FROM category_instances WHERE week_plan_id = ?', [
        plan.id,
      ]);
    } else {
      const result = await conn.run(
        `INSERT INTO week_plans (week_start_date, starting_balance, notes, strategy_notes, review_what_changed, review_new_money, review_bills_higher, review_notes, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
      plan.id = result.changes?.lastId ?? 0;
    }

    for (const c of plan.categoryInstances) {
      await conn.run(
        `INSERT INTO category_instances (week_plan_id, name, type, amount, visible, is_custom, sort_order, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.id!,
          c.name,
          c.type,
          c.amount ?? 0,
          c.visible !== false ? 1 : 0,
          c.isCustom ? 1 : 0,
          c.sortOrder ?? 0,
          c.notes ?? null,
          now,
          now,
        ]
      );
    }
    return (await this.getWeek(plan.id!))!;
  }

  async copyToNextWeek(
    sourcePlan: WeekPlan,
    config: SimpleBudgetConfig = DEFAULT_CONFIG
  ): Promise<WeekPlan> {
    const nextStart = format(
      addDays(new Date(sourcePlan.weekStartDate + 'T00:00:00'), 7),
      'yyyy-MM-dd'
    );
    const existing = await this.getWeekByDate(nextStart);
    if (existing) return existing;

    const now = new Date().toISOString();
    const conn = await this.db.getDbConnection();
    const result = await conn.run(
      `INSERT INTO week_plans (week_start_date, starting_balance, notes, status, created_at, updated_at)
       VALUES (?, 0, ?, 'draft', ?, ?)`,
      [nextStart, null, now, now]
    );
    const newId = result.changes?.lastId ?? 0;

    let sortOrder = 0;
    for (const c of sourcePlan.categoryInstances) {
      const amount =
        config.carryForwardFlexibleTargets && c.type === 'flexible'
          ? c.amount
          : 0;
      await conn.run(
        `INSERT INTO category_instances (week_plan_id, name, type, amount, visible, is_custom, sort_order, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
    }
    return (await this.getWeek(newId))!;
  }

  private async hydrateWeekPlan(row: Record<string, unknown>): Promise<WeekPlan> {
    const id = row['id'] as number;
    const conn = await this.db.getDbConnection();
    const catRows = await conn.query(
      'SELECT * FROM category_instances WHERE week_plan_id = ? ORDER BY sort_order, id',
      [id]
    );
    const categoryInstances: CategoryInstance[] = (
      catRows.values ?? []
    ).map((r: unknown) => {
      const c = r as Record<string, unknown>;
      return {
        id: c['id'] as number,
        weekPlanId: c['week_plan_id'] as number,
        name: c['name'] as string,
        type: c['type'] as 'income' | 'bills' | 'flexible',
        amount: (c['amount'] as number) ?? 0,
        visible: (c['visible'] as number) !== 0,
        isCustom: (c['is_custom'] as number) !== 0,
        sortOrder: (c['sort_order'] as number) ?? 0,
        notes: c['notes'] as string | undefined,
      };
    });
    return {
      id,
      weekStartDate: row['week_start_date'] as string,
      startingBalance: (row['starting_balance'] as number) ?? 0,
      categoryInstances,
      notes: row['notes'] as string | undefined,
      strategyNotes: row['strategy_notes'] as string | undefined,
      reviewWhatChanged: row['review_what_changed'] as string | undefined,
      reviewNewMoney: row['review_new_money'] as string | undefined,
      reviewBillsHigher: row['review_bills_higher'] as string | undefined,
      reviewNotes: row['review_notes'] as string | undefined,
      createdAt: row['created_at'] as string,
      updatedAt: row['updated_at'] as string,
      status: (row['status'] as 'draft' | 'saved') ?? 'draft',
    };
  }

  getDefaultTemplates(): CategoryTemplate[] {
    return ALL_DEFAULT_CATEGORIES;
  }

  /**
   * Seeds 3 months of budget data (Jan, Feb, Mar 2026) with realistic sample entries.
   * Uses Monday as week start. Overwrites any existing plans for those weeks.
   */
  async seedBudgetData(): Promise<void> {
    // Use Sunday-based weeks to match the app's week scroller (getSundayForDate)
    // Start from week containing Jan 1, 2026 (Sun Dec 28, 2025 – Jan 3, 2026)
    const weekDates: string[] = [
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

    const variance = (base: number, pct: number, seed: number) =>
      Math.round(base * (1 + ((seed % 100) / 100 - 0.5) * pct));

    for (let i = 0; i < weekDates.length; i++) {
      const weekStart = weekDates[i];
      const plan = await this.getOrCreateWeekByDate(weekStart, DEFAULT_CONFIG);

      const categoryInstances: CategoryInstance[] = [
        ...baseIncome.map((c, j) => ({
          weekPlanId: plan.id!,
          name: c.name,
          type: 'income' as const,
          amount: j === 0 ? variance(c.amount, 0.05, i * 7 + 1) : c.amount,
          visible: true,
          isCustom: false,
          sortOrder: j,
          notes: c.notes || undefined,
        })),
        ...baseBills.map((c, j) => ({
          weekPlanId: plan.id!,
          name: c.name,
          type: 'bills' as const,
          amount: c.amount > 0 ? variance(c.amount, 0.08, i * 11 + j) : 0,
          visible: true,
          isCustom: false,
          sortOrder: baseIncome.length + j,
          notes: c.notes || undefined,
        })),
        ...baseFlexible.map((c, j) => ({
          weekPlanId: plan.id!,
          name: c.name,
          type: 'flexible' as const,
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
}
