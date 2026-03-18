import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  calculateWeekSummary,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, CategoryInstance, WeekSummary } from '@upstart-productions/simple-budget';
import { addDays, format } from 'date-fns';

@Component({
  selector: 'app-simple-budget-weekly',
  templateUrl: './simple-budget-weekly.page.html',
  styleUrls: ['./simple-budget-weekly.page.scss'],
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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
  ],
})
export class SimpleBudgetWeeklyPage implements OnInit {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  loading = true;
  saving = false;
  weekDateRange = '';

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
      this.updateSummary();
      this.updateWeekDateRange();
    } catch (err) {
      console.warn('Simple Budget load error:', err);
    } finally {
      this.loading = false;
    }
  }

  private updateSummary() {
    if (!this.plan) return;
    this.summary = calculateWeekSummary(this.plan);
  }

  private updateWeekDateRange() {
    if (!this.plan) return;
    const start = new Date(this.plan.weekStartDate + 'T00:00:00');
    const end = addDays(start, 6);
    this.weekDateRange = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  get incomeCategories(): CategoryInstance[] {
    return (
      this.plan?.categoryInstances.filter((c) => c.type === 'income') ?? []
    );
  }

  get billsCategories(): CategoryInstance[] {
    return this.plan?.categoryInstances.filter((c) => c.type === 'bills') ?? [];
  }

  get flexibleCategories(): CategoryInstance[] {
    return (
      this.plan?.categoryInstances.filter((c) => c.type === 'flexible') ?? []
    );
  }

  onAmountChange() {
    this.updateSummary();
  }

  toggleVisible(c: CategoryInstance) {
    c.visible = !c.visible;
    this.updateSummary();
  }

  async addCategory(type: 'income' | 'bills' | 'flexible') {
    if (!this.plan) return;
    const maxOrder = Math.max(
      0,
      ...this.plan.categoryInstances
        .filter((c) => c.type === type)
        .map((c) => c.sortOrder)
    );
    this.plan.categoryInstances.push({
      weekPlanId: this.plan.id!,
      name: 'Custom',
      type,
      amount: 0,
      visible: true,
      isCustom: true,
      sortOrder: maxOrder + 1,
    });
    this.updateSummary();
  }

  async save() {
    if (!this.plan) return;
    this.saving = true;
    try {
      this.plan.status = 'saved';
      await this.weekPlanService.upsertWeek(this.plan);
      this.updateSummary();
    } catch (err) {
      console.warn('Save error:', err);
    } finally {
      this.saving = false;
    }
  }

  parseAmount(v: string | number): number {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
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
