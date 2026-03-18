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
  IonNote,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
  WeekPlanService,
  calculateWeekSummary,
  exportToJson,
  exportToCsv,
  buildExportRows,
  DEFAULT_CONFIG,
} from '@upstart-productions/simple-budget';
import type { WeekPlan, WeekSummary } from '@upstart-productions/simple-budget';
import { addDays, format } from 'date-fns';

@Component({
  selector: 'app-simple-budget-export',
  templateUrl: './simple-budget-export.page.html',
  styleUrls: ['./simple-budget-export.page.scss'],
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
    IonNote,
    IonButton,
    IonIcon,
  ],
})
export class SimpleBudgetExportPage implements OnInit {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  exportRows: { label: string; value: string | number }[] = [];
  loading = true;

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
      this.exportRows = buildExportRows(this.plan, this.summary);
    } catch (err) {
      console.warn('Export load error:', err);
    } finally {
      this.loading = false;
    }
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

  async exportJson() {
    if (!this.plan || !this.summary) return;
    const content = exportToJson(this.plan, this.summary);
    const filename = `budget-${this.plan.weekStartDate}.json`;
    await this.shareOrDownload(content, filename, 'application/json');
  }

  async exportCsv() {
    if (!this.plan || !this.summary) return;
    const content = exportToCsv(this.plan, this.summary);
    const filename = `budget-${this.plan.weekStartDate}.csv`;
    await this.shareOrDownload(content, filename, 'text/csv');
  }

  private async shareOrDownload(
    content: string,
    filename: string,
    mimeType: string
  ) {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Budget Export',
        text: content,
        dialogTitle: 'Share or save budget export',
      });
    } else {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}
