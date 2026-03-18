import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class SimpleBudgetQuickAdjustPage implements OnInit, OnDestroy {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  loading = true;
  saving = false;
  selectedIds: Set<string> = new Set();
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DEBOUNCE_MS = 400;

  readonly options = QUICK_ADJUST_OPTIONS;

  constructor(private weekPlanService: WeekPlanService) {}

  async ngOnInit() {
    await this.load();
  }

  ionViewDidEnter() {
    this.load();
  }

  ngOnDestroy() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
  }

  async load() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
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
    this.scheduleSave();
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  private scheduleSave(): void {
    if (!this.plan || this.saving) return;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.save();
    }, this.SAVE_DEBOUNCE_MS);
  }

  private async save() {
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
