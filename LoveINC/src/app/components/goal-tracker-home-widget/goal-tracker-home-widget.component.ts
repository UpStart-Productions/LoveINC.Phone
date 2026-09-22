import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  GoalTrackerHomeService,
  type GoalTrackerHomeSnapshot,
} from '@upstart-productions/goal-tracker';
import {
  ContentCardComponent,
  type ContentCardTextSegment,
} from '../content-card/content-card.component';
import { HomeClassToolsPreferenceService } from '../../services/home-class-tools-preference.service';

@Component({
  selector: 'app-goal-tracker-home-widget',
  templateUrl: './goal-tracker-home-widget.component.html',
  styleUrls: ['./goal-tracker-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class GoalTrackerHomeWidgetComponent implements OnInit, OnDestroy {
  @Output() visibleChange = new EventEmitter<boolean>();

  snapshot: GoalTrackerHomeSnapshot | null = null;
  loading = true;
  prefVisible = true;
  private prefSub?: Subscription;

  constructor(
    private goalTrackerHome: GoalTrackerHomeService,
    private homeClassTools: HomeClassToolsPreferenceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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

  /** Re-fetch from SQLite (e.g. when Home is shown or pull-to-refresh). */
  refresh(): void {
    this.loadSnapshot();
  }

  private loadSnapshot(): void {
    this.goalTrackerHome.getHomeSnapshot().subscribe({
      next: (s) => {
        this.snapshot = s;
        this.loading = false;
        this.emitVisible();
      },
      error: () => {
        this.loading = false;
        this.snapshot = null;
        this.emitVisible();
      },
    });
  }

  get cardTitle(): string {
    if (!this.snapshot) {
      return 'Goal Tracker';
    }
    const { scheduledTotal, completedTotal } = this.snapshot;
    if (scheduledTotal === 0) {
      return 'No habits scheduled today';
    }
    if (completedTotal >= scheduledTotal) {
      return 'All done for today';
    }
    return `${completedTotal} of ${scheduledTotal} habits for today`;
  }

  get titleSegments(): ContentCardTextSegment[] {
    if (!this.snapshot) {
      return [];
    }
    const { scheduledTotal, completedTotal } = this.snapshot;
    if (scheduledTotal === 0 || completedTotal >= scheduledTotal) {
      return [];
    }
    return [
      { text: `${completedTotal} of ${scheduledTotal}` },
      { text: ' habits for today' },
    ];
  }

  get cardDetail(): string {
    if (!this.snapshot) {
      return '';
    }
    if (this.snapshot.scheduledTotal === 0) {
      return '';
    }
    if (this.snapshot.completedTotal >= this.snapshot.scheduledTotal) {
      return 'Log or review your progress';
    }
    return 'Check off tasks for today';
  }

  get showCard(): boolean {
    return this.prefVisible && !this.loading && this.snapshot !== null;
  }

  private emitVisible(): void {
    this.visibleChange.emit(this.showCard);
  }
}
