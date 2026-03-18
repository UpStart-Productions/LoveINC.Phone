import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ModalController,
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
import { PdfPreviewModalComponent } from './components/pdf-preview-modal/pdf-preview-modal.component';

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
  ],
})
export class SimpleBudgetExportPage implements OnInit {
  plan: WeekPlan | null = null;
  summary: WeekSummary | null = null;
  exportRows: { label: string; value: string | number }[] = [];
  loading = true;
  exporting = false;

  constructor(
    private weekPlanService: WeekPlanService,
    private pdfService: PdfService,
    private budgetState: SimpleBudgetStateService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.load();
  }

  ionViewDidEnter() {
    this.load();
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
    if (!this.plan || !this.summary) return;
    this.exporting = true;
    try {
      const html = this.buildBudgetPdfHtml(this.plan, this.summary);
      const weekLabel = `Budget ${this.weekDateRange}`;
      const title = weekLabel;
      const filename = weekLabel.replace(/\s*-\s*/g, '-').replace(/\s+/g, '-').replace(/,/g, '');

      const pdfDoc = await this.pdfService.createPdfFromHtml(html, title);
      const pdfDataUrl = await this.pdfService.getPdfDataUrl(pdfDoc);

      const modal = await this.modalCtrl.create({
        component: PdfPreviewModalComponent,
        componentProps: {
          pdfDataUrl,
          filename,
          weekLabel,
          shareFilename: filename,
        },
        cssClass: 'pdf-preview-modal',
      });
      await modal.present();
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
    const weekOfLine =
      plan.weekStartDate
        ? `<tr><td colspan="2" style="padding: 2px 0 8px 0; font-size: 0.9em;">Week of ${this.weekDateRange}</td></tr>`
        : '';
    const rowsHtml =
      weekOfLine +
      rows
        .map((r) => {
          const n = typeof r.value === 'number' ? r.value : parseFloat(String(r.value));
          let amountStyle = 'padding: 4px 0; text-align: right;';
          if (!isNaN(n)) {
            if (n > 0) amountStyle += ' color: #1e9e5a;';
            else if (n < 0) amountStyle += ' color: #eb445a;';
          }
          return `<tr><td style="padding: 4px 8px 4px 0;">${r.label}</td><td style="${amountStyle}">${this.formatValue(r.value)}</td></tr>`;
        })
        .join('');

    const categoriesByType = {
      income: plan.categoryInstances.filter((c) => c.type === 'income' && c.visible),
      bills: plan.categoryInstances.filter((c) => c.type === 'bills' && c.visible),
      flexible: plan.categoryInstances.filter((c) => c.type === 'flexible' && c.visible),
    };

    const categoriesHtml = [
      categoriesByType.income.length
        ? `<h3>Money Coming In</h3><table>${categoriesByType.income.map((c) => `<tr><td style="padding: 2px 8px 2px 0;">${c.name}</td><td style="padding: 2px 0; text-align: right;">${this.formatValue(c.amount)}</td></tr>`).join('')}</table>`
        : '',
      categoriesByType.bills.length
        ? `<h3>Bills Due This Week</h3><table>${categoriesByType.bills.map((c) => `<tr><td style="padding: 2px 8px 2px 0;">${c.name}</td><td style="padding: 2px 0; text-align: right;">${this.formatValue(c.amount)}</td></tr>`).join('')}</table>`
        : '',
      categoriesByType.flexible.length
        ? `<h3>Flexible Targets</h3><table>${categoriesByType.flexible.map((c) => `<tr><td style="padding: 2px 8px 2px 0;">${c.name}</td><td style="padding: 2px 0; text-align: right;">${this.formatValue(c.amount)}</td></tr>`).join('')}</table>`
        : '',
    ]
      .filter(Boolean)
      .join('');

    return `
      <h2>Week Summary</h2>
      <table style="margin-bottom: 16px;">${rowsHtml}</table>
      ${categoriesHtml}
    `;
  }
}
