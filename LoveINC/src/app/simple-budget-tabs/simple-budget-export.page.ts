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
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, WeekSummary } from '@upstart-productions/simple-budget';
import { PdfService } from '../services/pdf.service';
import { SimpleBudgetStateService } from '../services/simple-budget-state.service';
import { UserProfileService } from '../services/user-profile.service';
import { OnboardingService } from '../services/onboarding.service';

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

    const summaryCellStyle = 'padding: 4px 8px 4px 0;';
    const summaryAmountStyle = 'padding: 4px 0; text-align: right;';

    const summaryRowsHtml = rows
      .map((r) => {
        const n = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
        let amountStyle = summaryAmountStyle;
        if (!isNaN(n)) {
          if (n > 0) amountStyle += ' color: #1e9e5a;';
          else if (n < 0) amountStyle += ' color: #eb445a;';
        }
        return `<tr><td style="${summaryCellStyle}">${r.label}</td><td style="${amountStyle}">${this.formatValue(r.value)}</td></tr>`;
      })
      .join('');

    const tableStyle = 'width: 100%; border-collapse: collapse;';
    return `
      <table style="${tableStyle} margin-bottom: 16px;">
        ${summaryRowsHtml}
      </table>
      <table style="${tableStyle}">
        ${headerRow}
        ${dataRows.join('')}
      </table>
    `;
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

    const summaryCellStyle = 'padding: 4px 8px 4px 0;';
    const summaryAmountStyle = 'padding: 4px 0; text-align: right;';
    const summaryRowsHtml = summaryRows
      .map((r) => {
        const n = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
        let amountStyle = summaryAmountStyle;
        if (!isNaN(n)) {
          if (n > 0) amountStyle += ' color: #1e9e5a;';
          else if (n < 0) amountStyle += ' color: #eb445a;';
        }
        return `<tr><td style="${summaryCellStyle}">${r.label}</td><td style="${amountStyle}">${this.formatValue(r.value)}</td></tr>`;
      })
      .join('');

    const tableStyle = 'width: 100%; border-collapse: collapse;';
    let html = `
      <h3 style="margin-bottom: 8px;">Monthly Totals</h3>
      <table style="${tableStyle} margin-bottom: 24px;">
        ${summaryRowsHtml}
      </table>
    `;

    for (const plan of this.monthlyWeeks) {
      const summary = calculateWeekSummary(plan);
      const weekHtml = this.buildBudgetPdfHtml(plan, summary);
      const [y, m, d] = plan.weekStartDate.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const end = addDays(start, 6);
      const weekLabel = `Week of ${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      html += `<h3 style="margin-top: 16px; margin-bottom: 8px;">${weekLabel}</h3>${weekHtml}`;
    }

    return html;
  }
}
