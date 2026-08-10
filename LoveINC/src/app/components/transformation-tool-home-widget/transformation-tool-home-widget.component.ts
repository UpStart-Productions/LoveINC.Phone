import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentCardComponent } from '../content-card/content-card.component';
import { PlatformApiService } from '../../services/platform';
import type { PlatformTransformationTool } from '../../services/platform/types';
import { GrovLinkDatabaseService } from '../../services/grovlink-database.service';
import {
  isTransformationToolFullyComplete,
  pickLatestTransformationTool,
} from '../../transformation-tools/transformation-tool-completion.util';

@Component({
  selector: 'app-transformation-tool-home-widget',
  templateUrl: './transformation-tool-home-widget.component.html',
  styleUrls: ['./transformation-tool-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class TransformationToolHomeWidgetComponent implements OnInit {
  tool: PlatformTransformationTool | null = null;
  isComplete = false;
  loading = true;

  constructor(
    private platformApi: PlatformApiService,
    private db: GrovLinkDatabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLatestTool();
  }

  refresh(): void {
    this.loadLatestTool();
  }

  get showCard(): boolean {
    return this.loading || this.tool !== null;
  }

  get cardTitle(): string {
    if (this.loading) {
      return 'Tools for Transformation';
    }
    return this.tool?.title ?? 'Tools for Transformation';
  }

  get cardDetail(): string {
    if (this.loading) {
      return 'Loading…';
    }
    const author = this.tool?.author?.name?.trim();
    if (author) {
      return `By ${author}`;
    }
    return 'Tap to explore';
  }

  get photoUrl(): string | undefined {
    const raw = this.tool?.photoUrl?.trim();
    if (!raw) {
      return undefined;
    }
    return this.platformApi.resolveUploadUrl(raw) || raw;
  }

  get toolRoute(): string {
    if (this.tool) {
      return `/tabs/transformation-tools/${this.tool.id}`;
    }
    return '/tabs/transformation-tools';
  }

  private loadLatestTool(): void {
    this.loading = true;
    this.platformApi.getTransformationTools().subscribe({
      next: async (items) => {
        const latest = pickLatestTransformationTool(items ?? []);
        this.tool = latest;
        this.isComplete = false;

        if (latest) {
          const responses = await this.db.getTransformationToolResponses(latest.id);
          this.isComplete = isTransformationToolFullyComplete(latest, responses);
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.tool = null;
        this.isComplete = false;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
