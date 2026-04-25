import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addDays, format } from 'date-fns';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  calculateWeekSummary,
  buildExportRows,
  QUICK_ADJUST_OPTIONS,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, WeekSummary } from '@upstart-productions/simple-budget';
import { PdfService } from '../services/pdf.service';
import { renderDonutToDataUrl, type PieSlice } from './utils/donut-chart-pdf';

const CATEGORY_PALETTE = [
  '#003049', '#52c0f6', '#32c058', '#214491', '#349394', '#d56132',
  '#eaa535', '#5433c6', '#eb445a', '#2c5f7d', '#1e9e5a', '#5a6c7d',
];
import { SimpleBudgetStateService } from '../services/simple-budget-state.service';
import { UserProfileService } from '../services/user-profile.service';
import { OnboardingService } from '../services/onboarding.service';
import { joinWithAppDot } from '../shared/utils';

@Component({
  selector: 'app-simple-budget-export',
  templateUrl: './simple-budget-export.page.html',
  styleUrls: ['./simple-budget-export.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
  ],
})
export class SimpleBudgetExportPage implements OnInit {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  exportRows: { label: string; value: string | number }[] = [];
  loading = true;
  exporting = false;

  exportMode: 'week' | 'month' = 'week';
  selectedMonthKey = '';
  monthsWithEntries: { key: string; label: string }[] = [];
  monthSelectPopoverOptions = { cssClass: 'month-select-popover', side: 'bottom' as const };
  monthlyWeeks: WeekPlan[] = [];
  monthlyTotals: { startingBalance: number; totalIncome: number; moneyAvailable: number; bills: number; flexible: number; remaining: number } = {
    startingBalance: 0,
    totalIncome: 0,
    moneyAvailable: 0,
    bills: 0,
    flexible: 0,
    remaining: 0,
  };

  constructor(
    private weekPlanService: WeekPlanService,
    private pdfService: PdfService,
    private budgetState: SimpleBudgetStateService,
    private userProfile: UserProfileService,
    private onboarding: OnboardingService
  ) {}

  async ngOnInit() {
    await this.loadMonths();
    if (this.exportMode === 'week') {
      await this.load();
    } else if (this.selectedMonthKey) {
      await this.loadMonthData();
    }
  }

  ionViewDidEnter() {
    this.loadMonths();
    if (this.exportMode === 'week') {
      this.load();
    } else if (this.selectedMonthKey) {
      this.loadMonthData();
    }
  }

  async loadMonths() {
    try {
      this.monthsWithEntries = await this.weekPlanService.getMonthsWithEntries();
      if (this.monthsWithEntries.length && !this.selectedMonthKey) {
        this.selectedMonthKey = this.monthsWithEntries[0].key;
      }
    } catch (err) {
      console.warn('Export load months error:', err);
    }
  }

  onExportModeChange() {
    if (this.exportMode === 'month' && this.selectedMonthKey) {
      this.loadMonthData();
    } else if (this.exportMode === 'week') {
      this.load();
    }
  }

  onMonthChange() {
    this.loadMonthData();
  }

  async loadMonthData() {
    if (!this.selectedMonthKey) return;
    this.loading = true;
    try {
      this.monthlyWeeks = await this.weekPlanService.getWeeksForMonth(this.selectedMonthKey);
      this.monthlyTotals = { startingBalance: 0, totalIncome: 0, moneyAvailable: 0, bills: 0, flexible: 0, remaining: 0 };
      for (const wp of this.monthlyWeeks) {
        const s = calculateWeekSummary(wp);
        this.monthlyTotals.startingBalance += wp.startingBalance;
        this.monthlyTotals.totalIncome += s.totalAvailable - wp.startingBalance;
        this.monthlyTotals.moneyAvailable += s.totalAvailable;
        this.monthlyTotals.bills += s.totalBills;
        this.monthlyTotals.flexible += s.totalFlexible;
        this.monthlyTotals.remaining += s.remaining;
      }
    } catch (err) {
      console.warn('Export load month error:', err);
    } finally {
      this.loading = false;
    }
  }

  async load() {
    this.loading = true;
    try {
      const weekStart =
        this.budgetState.selectedWeekStart ||
        this.weekPlanService.getWeekStartForDate(new Date(), DEFAULT_CONFIG.weekStartDay);
      this.plan = await this.weekPlanService.getOrCreateWeekByDate(weekStart, DEFAULT_CONFIG);
      this.summary = calculateWeekSummary(this.plan);
      this.exportRows = buildExportRows(this.plan, this.summary);
    } catch (err) {
      console.warn('Export load error:', err);
    } finally {
      this.loading = false;
    }
  }

  get weekDateRange(): string {
    if (!this.plan?.weekStartDate) return '';
    const [y, m, d] = this.plan.weekStartDate.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    const end = addDays(start, 6);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }

  get selectedMonthLabel(): string {
    const m = this.monthsWithEntries.find((x) => x.key === this.selectedMonthKey);
    return m?.label ?? '';
  }

  get monthlyDisplayRows(): { label: string; value: string | number }[] {
    const t = this.monthlyTotals;
    return [
      { label: 'Starting balance', value: t.startingBalance },
      { label: 'Total income', value: t.totalIncome },
      { label: 'Money available', value: t.moneyAvailable },
      { label: 'Bills due', value: t.bills },
      { label: 'Flexible targets', value: t.flexible },
      { label: 'Remaining', value: t.remaining },
    ];
  }

  get displayRows(): { label: string; value: string | number }[] {
    return this.exportRows.filter(
      (r) => r.label !== 'Week of' && r.label !== 'Days left in week'
    );
  }

  getAmountClass(row: { label: string; value: string | number }): 'positive' | 'negative' | null {
    const n = typeof row.value === 'number' ? row.value : parseFloat(String(row.value));
    if (isNaN(n)) return null;
    if (n > 0) return 'positive';
    if (n < 0) return 'negative';
    return null;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  formatValue(v: string | number): string {
    if (typeof v === 'number') {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v);
    }
    return String(v);
  }

  getUserFullName(): string | null {
    const profile = this.userProfile.getProfile();
    if (profile.firstName?.trim() && profile.lastName?.trim()) {
      return `${profile.firstName.trim()} ${profile.lastName.trim()}`;
    }
    return this.onboarding.getUserFullName();
  }

  async exportPdf() {
    this.exporting = true;
    try {
      if (this.exportMode === 'week' && this.plan && this.summary) {
        const html = this.buildBudgetPdfHtml(this.plan, this.summary);
        const weekLabel = `Budget ${this.weekDateRange}`;
        const filename = weekLabel.replace(/\s*-\s*/g, '-').replace(/\s+/g, '-').replace(/,/g, '');
        const pdfDoc = await this.pdfService.createPdfFromHtml(html, weekLabel, this.getUserFullName() ?? undefined);
        const filePath = await this.pdfService.savePdfToDevice(pdfDoc, filename);
        await this.pdfService.openPdfInNativeViewer(filePath);
      } else if (this.exportMode === 'month' && this.selectedMonthKey && this.monthlyWeeks.length) {
        const html = this.buildMonthlyPdfHtml();
        const title = `Budget ${this.selectedMonthLabel}`;
        const filename = title.replace(/\s+/g, '-');
        const pdfDoc = await this.pdfService.createPdfFromHtml(html, title, this.getUserFullName() ?? undefined);
        const filePath = await this.pdfService.savePdfToDevice(pdfDoc, filename);
        await this.pdfService.openPdfInNativeViewer(filePath);
      }
    } catch (err) {
      console.warn('PDF export error:', err);
    } finally {
      this.exporting = false;
    }
  }

  private getChartSlices(plan: WeekPlan, chartType: 'spending' | 'income'): PieSlice[] {
    const byName = new Map<string, number>();
    let colorIndex = 0;

    for (const c of plan.categoryInstances) {
      if (!c.visible) continue;
      if (chartType === 'spending' && c.type !== 'bills' && c.type !== 'flexible') continue;
      if (chartType === 'income' && c.type !== 'income') continue;
      const amt = c.amount ?? 0;
      if (amt <= 0) continue;
      const key = c.name.trim() || 'Other';
      byName.set(key, (byName.get(key) ?? 0) + amt);
    }

    const sorted = [...byName.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    return sorted.map(([label, value]) => ({
      label,
      value,
      color: CATEGORY_PALETTE[colorIndex++ % CATEGORY_PALETTE.length],
    }));
  }

  private buildLegendHtml(slices: PieSlice[]): string {
    const total = slices.filter((s) => s.value > 0).reduce((sum, s) => sum + s.value, 0);
    if (total <= 0) return '';

    return slices
      .filter((s) => s.value > 0)
      .map((s) => {
        const pct = Math.round((s.value / total) * 100);
        return `<tr><td style="padding: 2px 8px 2px 0; font-size: 9px; font-weight: bold; color: ${s.color};">${this.escapeHtml(s.label)}</td><td style="padding: 2px 0; text-align: right; font-size: 9px;">${this.formatValue(s.value)} (${pct}%)</td></tr>`;
      })
      .join('');
  }

  private buildChartSectionHtml(plan: WeekPlan): string {
    const spendingSlices = this.getChartSlices(plan, 'spending');
    const incomeSlices = this.getChartSlices(plan, 'income');
    const hasSpending = spendingSlices.length > 0 && spendingSlices.some((s) => s.value > 0);
    const hasIncome = incomeSlices.length > 0 && incomeSlices.some((s) => s.value > 0);
    if (!hasSpending && !hasIncome) return '';

    const chartSize = 180;
    const spendingChartUrl = hasSpending ? renderDonutToDataUrl(spendingSlices, chartSize) : null;
    const incomeChartUrl = hasIncome ? renderDonutToDataUrl(incomeSlices, chartSize) : null;
    const spendingBlock =
      hasSpending && spendingChartUrl
        ? `
        <td style="vertical-align: top; padding-right: 24px; width: 50%;">
          <b style="font-size: 12px; display: block; margin-bottom: 8px; text-align: center;">SPENDING</b>
          <div style="text-align: center; margin-bottom: 12px;"><img src="${spendingChartUrl}" width="${chartSize}" height="${chartSize}" alt="" /></div>
          <table style="width: 100%; border-collapse: collapse; border: none;">${this.buildLegendHtml(spendingSlices)}</table>
        </td>`
        : '';

    const incomeBlock =
      hasIncome && incomeChartUrl
        ? `
        <td style="vertical-align: top; width: 50%;">
          <b style="font-size: 12px; display: block; margin-bottom: 8px; text-align: center;">INCOME</b>
          <div style="text-align: center; margin-bottom: 12px;"><img src="${incomeChartUrl}" width="${chartSize}" height="${chartSize}" alt="" /></div>
          <table style="width: 100%; border-collapse: collapse; border: none;">${this.buildLegendHtml(incomeSlices)}</table>
        </td>`
        : '';

    return `
      <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 16px;" data-pdfmake="{\"widths\":[\"50%\",\"50%\"]}">
        <tr>${spendingBlock}${incomeBlock}</tr>
      </table>`;
  }

  private buildReviewHtml(plan: WeekPlan): string {
    const a = plan.reviewWhatChanged?.trim();
    const b = plan.reviewNewMoney?.trim();
    const c = plan.reviewBillsHigher?.trim();
    const d = plan.reviewNotes?.trim();

    const strategyIds = plan.strategyNotes?.trim()
      ? plan.strategyNotes.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const idToLabel = new Map(QUICK_ADJUST_OPTIONS.map((o) => [o.id, o.label]));
    const strategyLabels = strategyIds.map((id) => idToLabel.get(id) ?? id).filter(Boolean);

    const hasStrategies = strategyLabels.length > 0;
    const hasReview = !!(a || b || c || d);
    if (!hasStrategies && !hasReview) return '';

    const labelStyle = 'font-weight: bold; font-size: 10px; margin-bottom: 4px;';
    const textStyle = 'font-size: 10px; margin: 0 0 8px 0; line-height: 1.3;';
    const sections: string[] = [];

    if (hasStrategies) {
      const listItems = strategyLabels.map((l) => `&#8226; ${this.escapeHtml(l)}`).join('<br>');
      sections.push(`<p style="${textStyle}"><b style="${labelStyle}">Adjustment Strategies</b><br>${listItems}</p>`);
    }

    if (a) {
      sections.push(`<p style="${textStyle}"><b style="${labelStyle}">What changed from your plan?</b><br>${this.escapeHtml(a)}</p>`);
    }
    if (b) {
      sections.push(`<p style="${textStyle}"><b style="${labelStyle}">New money that came in</b><br>${this.escapeHtml(b)}</p>`);
    }
    if (c) {
      sections.push(`<p style="${textStyle}"><b style="${labelStyle}">Bills higher than expected</b><br>${this.escapeHtml(c)}</p>`);
    }
    if (d) {
      sections.push(`<p style="${textStyle}"><b style="${labelStyle}">Other notes</b><br>${this.escapeHtml(d)}</p>`);
    }

    return `<div style="font-size: 10px;">${sections.join('')}</div>`;
  }

  private buildBudgetPdfHtml(plan: WeekPlan, summary: WeekSummary): string {
    const rows = buildExportRows(plan, summary).filter(
      (r) => r.label !== 'Week of' && r.label !== 'Days left in week'
    );

    const categoriesByType = {
      income: plan.categoryInstances.filter((c) => c.type === 'income' && c.visible),
      bills: plan.categoryInstances.filter((c) => c.type === 'bills' && c.visible),
      flexible: plan.categoryInstances.filter((c) => c.type === 'flexible' && c.visible),
    };

    const cellStyle = 'padding: 4px 8px 4px 0;';
    const amountCellStyle = 'padding: 4px 0; text-align: right;';
    const headerCellStyle = 'padding: 4px 8px 4px 0; font-weight: 600;';

    const nameCell = (c: { name: string; notes?: string }) => {
      const notes = c.notes?.trim();
      const notesHtml = notes
        ? `<div style="font-size: 0.85em; color: #666; margin-top: 2px;">${this.escapeHtml(notes)}</div>`
        : '';
      return `${this.escapeHtml(c.name)}${notesHtml}`;
    };

    const maxRows = Math.max(
      categoriesByType.income.length,
      categoriesByType.bills.length,
      categoriesByType.flexible.length,
      1
    );

    const headerRow = `
      <tr>
        <th colspan="2" style="${headerCellStyle}">Money Coming In</th>
        <th colspan="2" style="${headerCellStyle}">Bills Due This Week</th>
        <th colspan="2" style="${headerCellStyle}">Flexible Targets</th>
      </tr>`;

    const dataRows: string[] = [];
    for (let i = 0; i < maxRows; i++) {
      const inc = categoriesByType.income[i];
      const bill = categoriesByType.bills[i];
      const flex = categoriesByType.flexible[i];
      dataRows.push(`
      <tr>
        <td style="${cellStyle}">${inc ? nameCell(inc) : ''}</td>
        <td style="${amountCellStyle}">${inc ? this.formatValue(inc.amount) : ''}</td>
        <td style="${cellStyle}">${bill ? nameCell(bill) : ''}</td>
        <td style="${amountCellStyle}">${bill ? this.formatValue(bill.amount) : ''}</td>
        <td style="${cellStyle}">${flex ? nameCell(flex) : ''}</td>
        <td style="${amountCellStyle}">${flex ? this.formatValue(flex.amount) : ''}</td>
      </tr>`);
    }

    const summaryCellStyle = 'padding: 0 8px 0 0;';
    const summaryAmountStyle = 'padding: 0; text-align: right;';
    const labelWrap = 'display: block; margin-top: 10px; margin-bottom: 0; padding: 0;';

    const summaryRowsHtml = rows
      .map((r) => {
        const n = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
        let amountStyle = summaryAmountStyle;
        if (!isNaN(n)) {
          if (n > 0) amountStyle += ' color: #1e9e5a;';
          else if (n < 0) amountStyle += ' color: #eb445a;';
        }
        return `<tr><td style="${summaryCellStyle}"><span style="${labelWrap}">${r.label}</span></td><td style="${amountStyle}"><span style="${labelWrap}">${this.formatValue(r.value)}</span></td></tr>`;
      })
      .join('');

    const reviewHtml = this.buildReviewHtml(plan);

    const tableStyle = 'width: 100%; border-collapse: collapse; border: none;';
    const summaryTable = `<table style="${tableStyle}" class="budgetTable">${summaryRowsHtml}</table>`;
    const categoriesTable = `<table style="${tableStyle}" class="budgetTable" data-pdfmake="{\"widths\":[\"*\",\"*\",\"*\",\"*\",\"*\",\"*\"]}">${headerRow}${dataRows.join('')}</table>`;

    const chartSection = this.buildChartSectionHtml(plan);
    const fullTableStyle = 'width: 100%; border-collapse: collapse; border: none; margin-bottom: 16px;';
    const mainTable = reviewHtml
      ? `
      <table style="${fullTableStyle}" class="budgetTable" data-pdfmake="{\"widths\":[\"50%\",\"50%\"]}">
        <tr>
          <td style="vertical-align: top; padding-right: 24px; width: 50%;">${summaryTable}</td>
          <td style="vertical-align: top; width: 50%;">${reviewHtml}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 16px;">${categoriesTable}</td>
        </tr>
      </table>`
      : `
      <table style="${fullTableStyle}" class="budgetTable" data-pdfmake="{\"widths\":[\"50%\",\"50%\"]}">
        <tr>
          <td style="vertical-align: top; padding-right: 24px; width: 50%;">${summaryTable}</td>
          <td style="vertical-align: top; width: 50%;"></td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 16px;">${categoriesTable}</td>
        </tr>
      </table>`;

    return chartSection ? `${chartSection}${mainTable}` : mainTable;
  }

  private buildMonthlyPdfHtml(): string {
    const t = this.monthlyTotals;
    const summaryRows = [
      { label: 'Starting balance', value: t.startingBalance },
      { label: 'Total income', value: t.totalIncome },
      { label: 'Money available', value: t.moneyAvailable },
      { label: 'Bills due', value: t.bills },
      { label: 'Flexible targets', value: t.flexible },
      { label: 'Remaining', value: t.remaining },
    ];

    const summaryCellStyle = 'padding: 0 8px 0 0;';
    const summaryAmountStyle = 'padding: 0; text-align: right;';
    const labelWrap = 'display: block; margin-top: 10px; margin-bottom: 0; padding: 0;';
    const summaryRowsHtml = summaryRows
      .map((r) => {
        const n = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
        let amountStyle = summaryAmountStyle;
        if (!isNaN(n)) {
          if (n > 0) amountStyle += ' color: #1e9e5a;';
          else if (n < 0) amountStyle += ' color: #eb445a;';
        }
        return `<tr><td style="${summaryCellStyle}"><span style="${labelWrap}">${r.label}</span></td><td style="${amountStyle}"><span style="${labelWrap}">${this.formatValue(r.value)}</span></td></tr>`;
      })
      .join('');

    const tableStyle = 'width: 100%; border-collapse: collapse; border: none;';
    let html = `
      <h3 style="margin-bottom: 8px;">Monthly Totals</h3>
      <table style="${tableStyle}; margin-bottom: 24px;" class="budgetTable">
        ${summaryRowsHtml}
      </table>
    `;

    for (const plan of this.monthlyWeeks) {
      const summary = calculateWeekSummary(plan);
      const weekHtml = this.buildBudgetPdfHtml(plan, summary);
      const [y, m, d] = plan.weekStartDate.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = addDays(start, 6);
      const weekLabel = `Week of ${joinWithAppDot(format(start, 'MMM d'), format(end, 'MMM d, yyyy'))}`;
      html += `<h3 style="margin-top: 16px; margin-bottom: 8px;">${weekLabel}</h3>${weekHtml}`;
    }

    return html;
  }
}
