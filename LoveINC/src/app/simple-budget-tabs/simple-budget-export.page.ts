import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addDays, format } from 'date-fns';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
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
  AlertController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import {
  WeekPlanService,
  calculateWeekSummary,
  buildExportRows,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, WeekSummary } from '@upstart-productions/simple-budget';
import { SimpleBudgetStateService } from '../services/simple-budget-state.service';
import {
  SimpleBudgetExportPdfService,
  type SimpleBudgetMonthlyTotals,
} from './services/simple-budget-export-pdf.service';

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
    AppBackButtonComponent,
  ],
})
export class SimpleBudgetExportPage implements OnInit {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  exportRows: { label: string; value: string | number }[] = [];
  loading = true;
  exporting = false;
  sharing = false;

  exportMode: 'week' | 'month' = 'week';
  selectedMonthKey = '';
  monthsWithEntries: { key: string; label: string }[] = [];
  monthSelectPopoverOptions = { cssClass: 'month-select-popover', side: 'bottom' as const };
  monthlyWeeks: WeekPlan[] = [];
  monthlyTotals: SimpleBudgetMonthlyTotals = {
    startingBalance: 0,
    totalIncome: 0,
    moneyAvailable: 0,
    bills: 0,
    flexible: 0,
    remaining: 0,
  };

  constructor(
    private weekPlanService: WeekPlanService,
    private budgetState: SimpleBudgetStateService,
    private exportPdfService: SimpleBudgetExportPdfService,
    private alertController: AlertController,
    private ngZone: NgZone
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
      this.monthlyTotals = {
        startingBalance: 0,
        totalIncome: 0,
        moneyAvailable: 0,
        bills: 0,
        flexible: 0,
        remaining: 0,
      };
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

  get canExportOrShare(): boolean {
    if (this.loading || this.exporting || this.sharing) return false;
    if (this.exportMode === 'week') return !!(this.plan && this.summary);
    return !!(this.selectedMonthKey && this.monthlyWeeks.length);
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

  async exportPdf() {
    if (!this.canExportOrShare) return;
    this.exporting = true;
    try {
      if (this.exportMode === 'week' && this.plan && this.summary) {
        await this.exportPdfService.exportWeekPdf(this.plan, this.summary, this.weekDateRange);
      } else if (this.exportMode === 'month' && this.selectedMonthKey && this.monthlyWeeks.length) {
        await this.exportPdfService.exportMonthPdf(
          this.monthlyWeeks,
          this.monthlyTotals,
          this.selectedMonthLabel
        );
      }
    } catch (err) {
      await this.presentAlert('Export failed', this.getErrorMessage(err));
    } finally {
      this.resetActionState('exporting');
    }
  }

  async shareBudget() {
    if (!this.canExportOrShare) return;
    this.sharing = true;
    try {
      if (this.exportMode === 'week' && this.plan && this.summary) {
        await this.exportPdfService.shareWeekPdf(this.plan, this.summary, this.weekDateRange);
      } else if (this.exportMode === 'month' && this.selectedMonthKey && this.monthlyWeeks.length) {
        await this.exportPdfService.shareMonthPdf(
          this.monthlyWeeks,
          this.monthlyTotals,
          this.selectedMonthLabel
        );
      }
    } catch (err) {
      if (!this.isShareCancelled(err)) {
        await this.presentAlert('Share failed', this.getErrorMessage(err));
      }
    } finally {
      this.resetActionState('sharing');
    }
  }

  private resetActionState(field: 'exporting' | 'sharing') {
    this.ngZone.run(() => {
      this[field] = false;
    });
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }
    return 'Something went wrong while creating the PDF.';
  }

  private isShareCancelled(err: unknown): boolean {
    const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    return message.includes('cancel') || message.includes('dismiss');
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
