import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { JournalService, type JournalEntry } from '@upstart-productions/journal';
import { ContentCardComponent } from '../content-card/content-card.component';
import { HomeClassToolsPreferenceService } from '../../services/home-class-tools-preference.service';

@Component({
  selector: 'app-journal-home-widget',
  templateUrl: './journal-home-widget.component.html',
  styleUrls: ['./journal-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class JournalHomeWidgetComponent implements OnInit, OnDestroy {
  @Output() visibleChange = new EventEmitter<boolean>();

  entries: JournalEntry[] = [];
  loading = true;
  prefVisible = true;
  private prefSub?: Subscription;

  private readonly monthAbbrev = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ] as const;

  constructor(
    private readonly journalService: JournalService,
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
    void this.loadEntries();
  }

  ngOnDestroy(): void {
    this.prefSub?.unsubscribe();
  }

  refresh(): void {
    void this.loadEntries();
  }

  get cardTitle(): string {
    const latest = this.entries[0];
    if (!latest) return 'Your Journal';
    return latest.title?.trim() || 'Untitled';
  }

  get cardDetail(): string {
    if (this.entries.length === 1) {
      const updated = this.formatUpdatedMonthDay(this.entries[0].updatedAt);
      return updated ? `Updated ${updated}` : 'Tap to open your journal';
    }
    const updated = this.formatUpdatedMonthDay(this.entries[0]?.updatedAt ?? '');
    const countLabel = `${this.entries.length} entries`;
    return updated ? `${countLabel} · Updated ${updated}` : countLabel;
  }

  get showCard(): boolean {
    return this.prefVisible && !this.loading && this.entries.length > 0;
  }

  private async loadEntries(): Promise<void> {
    this.loading = true;
    this.emitVisible();
    try {
      this.entries = await this.journalService.getAll();
    } catch {
      this.entries = [];
    } finally {
      this.loading = false;
      this.emitVisible();
    }
  }

  private formatUpdatedMonthDay(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${this.monthAbbrev[d.getMonth()]} ${d.getDate()}`;
  }

  private emitVisible(): void {
    this.visibleChange.emit(this.showCard);
  }
}
