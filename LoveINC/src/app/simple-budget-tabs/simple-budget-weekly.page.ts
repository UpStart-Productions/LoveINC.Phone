import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  calculateWeekSummary,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, CategoryInstance, WeekSummary } from '@upstart-productions/simple-budget';
import { addDays, format } from 'date-fns';
import { WeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { AddCategorySheetComponent } from './components/add-category-sheet/add-category-sheet.component';
import { CurrencyInputDirective } from './directives/currency-input.directive';

const SECTION_BORDER_CLASS: Record<string, string> = {
  income: 'border-emerald',
  bills: 'border-prussian-blue',
  flexible: 'border-picton-blue',
};

@Component({
  selector: 'app-simple-budget-weekly',
  templateUrl: './simple-budget-weekly.page.html',
  styleUrls: ['./simple-budget-weekly.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyInputDirective,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    WeekScrollerComponent,
  ],
})
export class SimpleBudgetWeeklyPage implements OnInit, OnDestroy {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  loading = true;
  saving = false;
  selectedWeekStart = '';
  private displayAmounts: Record<string, string> = {};
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DEBOUNCE_MS = 600;

  constructor(
    private weekPlanService: WeekPlanService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.loadForWeek(this.getCurrentWeekStart());
  }

  ionViewDidEnter() {
    if (this.selectedWeekStart) this.loadForWeek(this.selectedWeekStart);
  }

  ngOnDestroy() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
  }

  private getCurrentWeekStart(): string {
    return this.weekPlanService.getWeekStartForDate(new Date(), 0);
  }

  async onWeekSelected(weekStartDate: string) {
    this.selectedWeekStart = weekStartDate;
    await this.loadForWeek(weekStartDate);
  }

  async loadForWeek(weekStartDate: string) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.loading = true;
    this.displayAmounts = {};
    try {
      this.plan = await this.weekPlanService.getOrCreateWeekByDate(weekStartDate, DEFAULT_CONFIG);
      this.selectedWeekStart = weekStartDate;
      this.updateSummary();
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

  get incomeCategories(): CategoryInstance[] {
    return this.plan?.categoryInstances.filter((c) => c.type === 'income') ?? [];
  }

  get billsCategories(): CategoryInstance[] {
    return this.plan?.categoryInstances.filter((c) => c.type === 'bills') ?? [];
  }

  get flexibleCategories(): CategoryInstance[] {
    return this.plan?.categoryInstances.filter((c) => c.type === 'flexible') ?? [];
  }

  getBorderClass(type: string): string {
    return SECTION_BORDER_CLASS[type] ?? 'border-prussian-blue';
  }

  onAmountChange() {
    this.updateSummary();
    this.scheduleSave();
  }

  async addCategory(type: 'income' | 'bills' | 'flexible') {
    if (!this.plan) return;
    const suggested = await this.weekPlanService.getSuggestedCategoryNames(type);
    const modal = await this.modalCtrl.create({
      component: AddCategorySheetComponent,
      cssClass: 'budget-add-category-sheet',
      componentProps: { type, suggestedNames: suggested },
      presentingElement: await this.modalCtrl.getTop(),
      showBackdrop: true,
      backdropDismiss: true,
      breakpoints: [0, 0.55, 1],
      initialBreakpoint: 0.55,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss<{ name?: string; isCustom?: boolean }>();
    if (data?.name) {
      if (data.isCustom) {
        this.weekPlanService.addUserCategoryTemplate(data.name, type);
      }
      this.addCategoryInstance(type, data.name, data.isCustom ?? false);
    }
  }

  private addCategoryInstance(type: 'income' | 'bills' | 'flexible', name: string, isCustom: boolean) {
    if (!this.plan) return;
    this.displayAmounts = {};
    const maxOrder = Math.max(
      0,
      ...this.plan.categoryInstances.filter((c) => c.type === type).map((c) => c.sortOrder)
    );
    this.plan.categoryInstances.push({
      weekPlanId: this.plan.id!,
      name,
      type,
      amount: 0,
      visible: true,
      isCustom,
      sortOrder: maxOrder + 1,
    });
    this.updateSummary();
    this.scheduleSave();
  }

  async removeCategory(c: CategoryInstance) {
    if (!this.plan) return;
    const alert = await this.alertCtrl.create({
      header: 'Remove category',
      message: `Remove "${c.name}" from this week?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Remove', role: 'destructive', handler: () => this.doRemoveCategory(c) },
      ],
    });
    await alert.present();
  }

  private doRemoveCategory(c: CategoryInstance) {
    if (!this.plan) return;
    this.displayAmounts = {};
    this.plan.categoryInstances = this.plan.categoryInstances.filter((x) => x !== c);
    this.updateSummary();
    this.scheduleSave();
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

  formatAmountForInput(n: number, key?: string): string {
    const k = key ?? '';
    if (this.displayAmounts[k] !== undefined) return this.displayAmounts[k];
    if (n === 0) return '';
    return n.toFixed(2);
  }

  setStartingBalance(v: number): void {
    if (this.plan) this.plan.startingBalance = v;
  }

  setCategoryAmount(c: CategoryInstance, v: number): void {
    c.amount = v;
  }

  async onAmountFocus(_key: string, ionInputEl: { getInputElement: () => Promise<HTMLInputElement> }): Promise<void> {
    setTimeout(async () => {
      const native = await ionInputEl.getInputElement();
      if (native) {
        const len = (native.value ?? '').length;
        native.setSelectionRange(len, len);
      }
    }, 50);
  }

  onAmountBlur(key: string, value: number): void {
    if (value !== 0) {
      this.displayAmounts[key] = value.toFixed(2);
    }
  }

  async onAmountInput(
    event: Event,
    setter: (n: number) => void,
    key: string,
    ionInputEl: { getInputElement: () => Promise<HTMLInputElement> }
  ): Promise<void> {
    const native = await ionInputEl.getInputElement();
    const raw = native?.value ?? (event as CustomEvent).detail?.value ?? '';
    let s = String(raw).replace(/[^0-9.]/g, '');
    const parts = s.split('.');
    if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      s = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (s.startsWith('0') && s.length > 1 && !s.startsWith('0.')) {
      s = s.replace(/^0+/, '') || '0';
    }
    // Preserve exact input during editing so user can backspace through whole numbers (745 → 74 → 7 → empty)
    if (s) {
      this.displayAmounts[key] = s;
    } else {
      delete this.displayAmounts[key];
    }
    const n = parseFloat(s || '0');
    setter(isNaN(n) ? 0 : n);
    this.onAmountChange();
    if (native && s !== raw) {
      native.value = s;
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

  formatBadgeAmount(remaining: number): string {
    const abs = Math.abs(remaining);
    return abs.toFixed(2);
  }
}
