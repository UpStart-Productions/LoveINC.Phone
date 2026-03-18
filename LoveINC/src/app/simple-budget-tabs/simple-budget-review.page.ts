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
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan } from '@upstart-productions/simple-budget';

@Component({
  selector: 'app-simple-budget-review',
  templateUrl: './simple-budget-review.page.html',
  styleUrls: ['./simple-budget-review.page.scss'],
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
    IonTextarea,
    IonButton,
  ],
})
export class SimpleBudgetReviewPage implements OnInit, OnDestroy {
  plan: WeekPlan | null = null;
  loading = true;
  saving = false;
  copying = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DEBOUNCE_MS = 600;

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
    } catch (err) {
      console.warn('Review load error:', err);
    } finally {
      this.loading = false;
    }
  }

  scheduleSave(): void {
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
      await this.weekPlanService.upsertWeek(this.plan);
    } catch (err) {
      console.warn('Save error:', err);
    } finally {
      this.saving = false;
    }
  }

  async copyToNextWeek() {
    if (!this.plan) return;
    this.copying = true;
    try {
      this.plan = await this.weekPlanService.copyToNextWeek(this.plan, DEFAULT_CONFIG);
    } catch (err) {
      console.warn('Copy error:', err);
    } finally {
      this.copying = false;
    }
  }
}
