import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ContentCardComponent } from '../content-card/content-card.component';
import { SavedJobsService } from '../../job-search/saved-jobs.service';
import { HomeClassToolsPreferenceService } from '../../services/home-class-tools-preference.service';
import { trimJobTitle } from '../../shared/utils/job-title.util';

@Component({
  selector: 'app-job-search-home-widget',
  templateUrl: './job-search-home-widget.component.html',
  styleUrls: ['./job-search-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class JobSearchHomeWidgetComponent implements OnInit, OnDestroy {
  @Output() visibleChange = new EventEmitter<boolean>();

  savedCount = 0;
  prefVisible = true;
  private savedSub?: Subscription;
  private prefSub?: Subscription;

  constructor(
    private readonly savedJobs: SavedJobsService,
    private readonly homeClassTools: HomeClassToolsPreferenceService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.prefVisible = this.homeClassTools.isVisible();
    this.prefSub = this.homeClassTools.visibility$.subscribe((visible) => {
      this.prefVisible = visible;
      this.emitVisible();
      this.cdr.markForCheck();
    });
    this.syncSavedCount();
    this.savedSub = this.savedJobs.watch().subscribe(() => {
      this.syncSavedCount();
    });
  }

  ngOnDestroy(): void {
    this.savedSub?.unsubscribe();
    this.prefSub?.unsubscribe();
  }

  refresh(): void {
    this.syncSavedCount();
  }

  get cardTitle(): string {
    const saved = this.savedJobs.list();
    if (saved.length === 1) {
      const job = saved[0].job;
      return trimJobTitle(job.title, job.companyName);
    }
    return `${saved.length} saved jobs`;
  }

  get cardDetail(): string {
    const saved = this.savedJobs.list();
    if (saved.length === 1) {
      return saved[0].job.companyName?.trim() || 'Tap to open saved jobs';
    }
    return 'Tap to view saved jobs';
  }

  get showCard(): boolean {
    return this.prefVisible && this.savedCount > 0;
  }

  private syncSavedCount(): void {
    const next = this.savedJobs.list().length;
    if (this.savedCount === next) {
      this.emitVisible();
      return;
    }
    this.savedCount = next;
    this.emitVisible();
  }

  private emitVisible(): void {
    this.visibleChange.emit(this.showCard);
  }
}
