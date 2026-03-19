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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonChip,
  PopoverController,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  calculateWeekSummary,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, WeekSummary } from '@upstart-productions/simple-budget';
import { SimpleBudgetStateService } from '../services/simple-budget-state.service';
import { PieChartComponent, type PieSlice } from './components/pie-chart/pie-chart.component';

const CATEGORY_PALETTE = [
  '#003049',
  '#52c0f6',
  '#32c058',
  '#214491',
  '#349394',
  '#d56132',
  '#eaa535',
  '#5433c6',
  '#eb445a',
  '#2c5f7d',
  '#1e9e5a',
  '#5a6c7d',
];

@Component({
  selector: 'app-simple-budget-reports',
  templateUrl: './simple-budget-reports.page.html',
  styleUrls: ['./simple-budget-reports.page.scss'],
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
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonChip,
    PieChartComponent,
  ],
})
export class SimpleBudgetReportsPage implements OnInit {
  loading = true;
  reportMode: 'week' | 'month' = 'week';
  chartType: 'spending' | 'income' = 'spending';
  selectedMonthKey = '';
  monthsWithEntries: { key: string; label: string }[] = [];
  monthSelectPopoverOptions = { cssClass: 'month-select-popover', side: 'bottom' as const };

  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  monthlyWeeks: WeekPlan[] = [];
  monthlyTotals = { moneyAvailable: 0, totalIncome: 0, bills: 0, flexible: 0 };

  chartSlices: PieSlice[] = [];
  chartKey = 0;

  constructor(
    private weekPlanService: WeekPlanService,
    private budgetState: SimpleBudgetStateService,
    private popoverCtrl: PopoverController
  ) {}

  async ngOnInit() {
    await this.loadMonths();
    if (this.reportMode === 'week') {
      await this.loadWeek();
    } else if (this.selectedMonthKey) {
      await this.loadMonth();
    }
  }

  ionViewDidEnter() {
    this.loadMonths();
    if (this.reportMode === 'week') {
      this.loadWeek();
    } else if (this.selectedMonthKey) {
      this.loadMonth();
    }
  }

  ionViewDidLeave() {
    this.popoverCtrl.dismiss();
  }

  async loadMonths() {
    try {
      this.monthsWithEntries = await this.weekPlanService.getMonthsWithEntries();
      if (this.monthsWithEntries.length && !this.selectedMonthKey) {
        this.selectedMonthKey = this.monthsWithEntries[0].key;
      }
    } catch (err) {
      console.warn('Reports load months error:', err);
    }
  }

  onReportModeChange() {
    if (this.reportMode === 'month' && this.selectedMonthKey) {
      this.loadMonth();
    } else if (this.reportMode === 'week') {
      this.loadWeek();
    }
  }

  onChartTypeChange() {
    this.chartType = this.chartType === 'spending' ? 'income' : 'spending';
    if (this.reportMode === 'week' && this.plan) {
      this.buildChartFromWeek();
    } else if (this.reportMode === 'month' && this.monthlyWeeks.length) {
      this.buildChartFromMonth();
    }
  }

  onMonthChange() {
    this.loadMonth();
  }

  async loadWeek() {
    this.loading = true;
    try {
      const weekStart =
        this.budgetState.selectedWeekStart ||
        this.weekPlanService.getWeekStartForDate(new Date(), DEFAULT_CONFIG.weekStartDay);
      this.plan = await this.weekPlanService.getOrCreateWeekByDate(weekStart, DEFAULT_CONFIG);
      this.summary = calculateWeekSummary(this.plan);
      this.buildChartFromWeek();
    } catch (err) {
      console.warn('Reports load week error:', err);
    } finally {
      this.loading = false;
    }
  }

  async loadMonth() {
    if (!this.selectedMonthKey) return;
    this.loading = true;
    try {
      this.monthlyWeeks = await this.weekPlanService.getWeeksForMonth(this.selectedMonthKey);
      this.monthlyTotals = { moneyAvailable: 0, totalIncome: 0, bills: 0, flexible: 0 };
      for (const wp of this.monthlyWeeks) {
        const s = calculateWeekSummary(wp);
        this.monthlyTotals.moneyAvailable += s.totalAvailable;
        this.monthlyTotals.totalIncome += s.totalAvailable - wp.startingBalance;
        this.monthlyTotals.bills += s.totalBills;
        this.monthlyTotals.flexible += s.totalFlexible;
      }
      this.buildChartFromMonth();
    } catch (err) {
      console.warn('Reports load month error:', err);
    } finally {
      this.loading = false;
    }
  }

  private buildChartFromWeek() {
    if (!this.plan) {
      this.chartSlices = [];
      this.chartKey++;
      return;
    }
    const slices = this.getCategorySlices([this.plan]);
    this.chartSlices = slices;
    this.chartKey++;
  }

  private buildChartFromMonth() {
    const slices = this.getCategorySlices(this.monthlyWeeks);
    this.chartSlices = slices;
    this.chartKey++;
  }

  private getCategorySlices(plans: WeekPlan[]): PieSlice[] {
    const byName = new Map<string, number>();
    let colorIndex = 0;

    const types: ('income' | 'bills' | 'flexible')[] =
      this.chartType === 'spending' ? ['bills', 'flexible'] : ['income'];

    for (const plan of plans) {
      for (const c of plan.categoryInstances) {
        if (!c.visible || !types.includes(c.type)) continue;
        const amt = c.amount ?? 0;
        if (amt <= 0) continue;
        const key = c.name.trim() || 'Other';
        byName.set(key, (byName.get(key) ?? 0) + amt);
      }
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

  get hasChartData(): boolean {
    return this.chartSlices.length > 0 && this.chartSlices.some((s) => s.value > 0);
  }
}
