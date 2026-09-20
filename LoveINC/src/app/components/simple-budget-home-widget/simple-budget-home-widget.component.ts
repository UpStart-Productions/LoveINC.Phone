import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  SimpleBudgetHomeService,
  SimpleBudgetHomeSnapshot,
} from '@upstart-productions/simple-budget';
import {
  ContentCardComponent,
  type ContentCardTextSegment,
} from '../content-card/content-card.component';
import { HomeClassToolsPreferenceService } from '../../services/home-class-tools-preference.service';

@Component({
  selector: 'app-simple-budget-home-widget',
  templateUrl: './simple-budget-home-widget.component.html',
  styleUrls: ['./simple-budget-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class SimpleBudgetHomeWidgetComponent implements OnInit, OnDestroy {
  @Output() visibleChange = new EventEmitter<boolean>();

  snapshot: SimpleBudgetHomeSnapshot | null = null;
  loading = true;
  prefVisible = true;
  private prefSub?: Subscription;

  constructor(
    private simpleBudgetHomeService: SimpleBudgetHomeService,
    private homeClassTools: HomeClassToolsPreferenceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.prefVisible = this.homeClassTools.isVisible();
    this.prefSub = this.homeClassTools.visibility$.subscribe((visible) => {
      this.prefVisible = visible;
      this.emitVisible();
      this.cdr.markForCheck();
    });
    this.loading = true;
    this.emitVisible();
    this.loadSnapshot();
  }

  ngOnDestroy(): void {
    this.prefSub?.unsubscribe();
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
        this.emitVisible();
      },
      error: () => {
        this.loading = false;
        this.emitVisible();
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

  /** Per-day spend for the detail line — uses days left in-week, or spreads over 7 when the week ended. */
  get dailySpendAmount(): number {
    const summary = this.snapshot!.summary;
    if (summary.daysLeftInWeek > 0) {
      return summary.safeToSpendPerDay;
    }
    return Math.round((summary.remaining / 7) * 100) / 100;
  }

  get cardDetail(): string {
    if (!this.snapshot) return '';
    return `About ${this.formatCurrency(this.dailySpendAmount)}/day to spend`;
  }

  /** Colored per-day amount below the balance. */
  get detailSegments(): ContentCardTextSegment[] {
    if (!this.snapshot) return [];
    const daily = this.formatCurrency(this.dailySpendAmount);
    const tone = this.dailySpendAmount >= 0 ? 'positive' : 'negative';
    return [
      { text: 'About ' },
      { text: daily, tone },
      { text: '/day to spend' },
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
    return this.prefVisible && !this.loading && this.snapshot !== null;
  }

  private emitVisible(): void {
    this.visibleChange.emit(this.showCard);
  }
}
