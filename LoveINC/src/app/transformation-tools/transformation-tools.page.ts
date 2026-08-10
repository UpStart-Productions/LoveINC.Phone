import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { PlatformApiService } from '../services/platform';
import type { PlatformTransformationTool } from '../services/platform/types';
import { GrovLinkDatabaseService } from '../services/grovlink-database.service';
import { isTransformationToolFullyComplete } from './transformation-tool-completion.util';

@Component({
  selector: 'app-transformation-tools',
  templateUrl: './transformation-tools.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    ContentCardListComponent,
    AppBackButtonComponent,
  ],
})
export class TransformationToolsPage implements OnInit {
  tools: PlatformTransformationTool[] = [];
  loading = true;
  private completedToolIds = new Set<string>();

  constructor(
    private platformApi: PlatformApiService,
    private db: GrovLinkDatabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTools();
  }

  async ionViewWillEnter(): Promise<void> {
    if (this.tools.length > 0) {
      await this.refreshCompletionStatus();
    }
  }

  loadTools() {
    this.loading = true;
    this.platformApi.getTransformationTools().subscribe({
      next: (items) => {
        this.tools = (items ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
        this.loading = false;
        void this.refreshCompletionStatus();
      },
      error: (err) => {
        console.error('Error loading transformation tools:', err);
        this.loading = false;
      },
    });
  }

  get transformationToolListItems(): ContentCardListItem[] {
    return this.tools.map((tool) => {
      const photoUrl = tool.photoUrl
        ? this.platformApi.resolveUploadUrl(tool.photoUrl) || tool.photoUrl
        : undefined;
      const isComplete = this.completedToolIds.has(tool.id);

      return {
        id: tool.id,
        title: tool.title,
        detail: tool.author?.name?.trim() ? `By ${tool.author.name.trim()}` : undefined,
        imageUrl: photoUrl,
        iconName: photoUrl ? undefined : 'compass-outline',
        iconBackgroundColor: '#349394',
        avatarOverlayIcon: photoUrl && isComplete ? 'checkmark-circle' : undefined,
        avatarOverlayIconColor: 'success',
        route: `/tabs/transformation-tools/${tool.id}`,
        preserveQueryParams: true,
      };
    });
  }

  private async refreshCompletionStatus(): Promise<void> {
    const next = new Set<string>();

    for (const tool of this.tools) {
      const responses = await this.db.getTransformationToolResponses(tool.id);
      if (isTransformationToolFullyComplete(tool, responses)) {
        next.add(tool.id);
      }
    }

    this.completedToolIds = next;
    this.cdr.markForCheck();
  }
}
