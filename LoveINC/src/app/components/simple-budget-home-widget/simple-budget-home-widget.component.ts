import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SimpleBudgetHomeService,
  SimpleBudgetHomeSnapshot,
} from '@upstart-productions/simple-budget';
import {
  ContentCardComponent,
  type ContentCardTextSegment,
} from '../content-card/content-card.component';

@Component({
  selector: 'app-simple-budget-home-widget',
  templateUrl: './simple-budget-home-widget.component.html',
  styleUrls: ['./simple-budget-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class SimpleBudgetHomeWidgetComponent implements OnInit {
  snapshot: SimpleBudgetHomeSnapshot | null = null;
  loading = true;

  constructor(private simpleBudgetHomeService: SimpleBudgetHomeService) {}

  ngOnInit() {
    this.loading = true;
    this.loadSnapshot();
  }

  /** Re-fetch from SQLite (e.g. when Home tab is shown after editing Weekly Budget). */
  refresh(): void {
    this.loadSnapshot();
  }

  private loadSnapshot(): void {
    this.simpleBudgetHomeService.getCurrentWeekSnapshot().subscribe({
      next: (s) => {
        this.snapshot = s;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get cardTitle(): string {
    if (!this.snapshot) return 'Simple Budget';
    const { summary } = this.snapshot;
    return summary.isOverPlan
      ? `Over by ${this.formatCurrency(Math.abs(summary.remaining))}`
      : `Balance: ${this.formatCurrency(summary.remaining)}`;
  }

  /** Colored amount in title (green / red). */
  get titleSegments(): ContentCardTextSegment[] {
    if (!this.snapshot) return [];
    const { summary } = this.snapshot;
    if (summary.isOverPlan) {
      return [
        { text: 'Over by ' },
        { text: this.formatCurrency(Math.abs(summary.remaining)), tone: 'negative' },
      ];
    }
    const remaining = summary.remaining;
    return [
      { text: 'Balance: ' },
      {
        text: this.formatCurrency(remaining),
        tone: remaining >= 0 ? 'positive' : 'negative',
      },
    ];
  }

  get cardDetail(): string {
    if (!this.snapshot) return '';
    const { summary } = this.snapshot;
    const daily = this.formatCurrency(summary.safeToSpendPerDay);
    const days = summary.daysLeftInWeek;
    if (days > 0) {
      return `About ${daily}/day to spend · Tap to update your budget`;
    }
    return 'Tap to update your budget';
  }

  /** Colored per-day amount when mid-week. */
  get detailSegments(): ContentCardTextSegment[] | null {
    if (!this.snapshot) return null;
    const { summary } = this.snapshot;
    if (summary.daysLeftInWeek <= 0) return null;
    const daily = this.formatCurrency(summary.safeToSpendPerDay);
    const tone = summary.safeToSpendPerDay >= 0 ? 'positive' : 'negative';
    return [
      { text: 'About ' },
      { text: daily, tone },
      { text: '/day to spend · Tap to update your budget' },
    ];
  }

  private formatCurrency(n: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }

  get showCard(): boolean {
    return !this.loading && this.snapshot !== null;
  }
}
