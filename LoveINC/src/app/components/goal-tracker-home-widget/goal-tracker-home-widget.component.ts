import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoalTrackerHomeService,
  type GoalTrackerHomeSnapshot,
} from '@upstart-productions/goal-tracker';
import {
  ContentCardComponent,
  type ContentCardTextSegment,
} from '../content-card/content-card.component';

@Component({
  selector: 'app-goal-tracker-home-widget',
  templateUrl: './goal-tracker-home-widget.component.html',
  styleUrls: ['./goal-tracker-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class GoalTrackerHomeWidgetComponent implements OnInit {
  snapshot: GoalTrackerHomeSnapshot | null = null;
  loading = true;

  constructor(private goalTrackerHome: GoalTrackerHomeService) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadSnapshot();
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
      },
      error: () => {
        this.loading = false;
        this.snapshot = null;
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
      return 'Tap to open Goal Tracker';
    }
    if (this.snapshot.completedTotal >= this.snapshot.scheduledTotal) {
      return 'Tap to log or review your progress';
    }
    return 'Tap to check off tasks for today';
  }

  get showCard(): boolean {
    return !this.loading && this.snapshot !== null;
  }
}
