import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonButton,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  calculateWeekSummary,
  QUICK_ADJUST_OPTIONS,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, WeekSummary } from '@upstart-productions/simple-budget';

@Component({
  selector: 'app-simple-budget-quick-adjust',
  templateUrl: './simple-budget-quick-adjust.page.html',
  styleUrls: ['./simple-budget-quick-adjust.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonButton,
  ],
})
export class SimpleBudgetQuickAdjustPage implements OnInit {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  loading = true;
  saving = false;
  selectedIds: Set<string> = new Set();

  readonly options = QUICK_ADJUST_OPTIONS;

  constructor(private weekPlanService: WeekPlanService) {}

  async ngOnInit() {
    await this.load();
  }

  ionViewDidEnter() {
    this.load();
  }

  async load() {
    this.loading = true;
    try {
      this.plan = await this.weekPlanService.getOrCreateCurrentWeek(DEFAULT_CONFIG);
      this.summary = calculateWeekSummary(this.plan);
      this.selectedIds = new Set(
        (this.plan.strategyNotes ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } catch (err) {
      console.warn('Quick Adjust load error:', err);
    } finally {
      this.loading = false;
    }
  }

  toggleOption(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else if (this.selectedIds.size < 3) {
      this.selectedIds.add(id);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  async save() {
    if (!this.plan) return;
    this.saving = true;
    try {
      this.plan.strategyNotes = [...this.selectedIds].join(', ');
      await this.weekPlanService.upsertWeek(this.plan);
    } catch (err) {
      console.warn('Save error:', err);
    } finally {
      this.saving = false;
    }
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
}
