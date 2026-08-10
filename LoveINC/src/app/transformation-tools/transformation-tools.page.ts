import { Component, OnInit } from '@angular/core';
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

  constructor(private platformApi: PlatformApiService) {}

  ngOnInit() {
    this.loadTools();
  }

  loadTools() {
    this.loading = true;
    this.platformApi.getTransformationTools().subscribe({
      next: (items) => {
        this.tools = (items ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading transformation tools:', err);
        this.loading = false;
      },
    });
  }

  get transformationToolListItems(): ContentCardListItem[] {
    return this.tools.map((tool) => ({
      id: tool.id,
      title: tool.title,
      detail: this.getScriptureSubtitle(tool) || undefined,
      imageUrl: tool.photoUrl,
      iconName: tool.photoUrl ? undefined : 'compass-outline',
      iconBackgroundColor: '#349394',
      route: `/tabs/transformation-tools/${tool.id}`,
      preserveQueryParams: true,
    }));
  }

  private getScriptureSubtitle(tool: PlatformTransformationTool): string {
    return (tool.scriptureRefs ?? []).join(' • ');
  }
}
