/**
 * Export utilities for Simple Budget - JSON and CSV
 */

import type { WeekPlan, WeekSummary, ExportRow } from '../types/week-plan.types';
import { calculateWeekSummary } from './calculate-week-summary';
import { format } from 'date-fns';

export function buildExportRows(plan: WeekPlan, summary: WeekSummary): ExportRow[] {
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

export function exportToJson(plan: WeekPlan, summary: WeekSummary): string {
  const rows = buildExportRows(plan, summary);
  const summaryObj: Record<string, string | number> = {};
  for (const r of rows) summaryObj[r.label] = r.value;
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

export function exportToCsv(plan: WeekPlan, summary: WeekSummary): string {
  const rows = buildExportRows(plan, summary);
  const lines = rows.map((r) => `"${r.label}","${r.value}"`);
  return 'Label,Value\n' + lines.join('\n');
}
