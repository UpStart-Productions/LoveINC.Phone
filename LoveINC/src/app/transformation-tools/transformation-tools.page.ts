import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { CardComponent } from '../components/card/card.component';
import { PlatformApiService } from '../services/platform';
import type { PlatformTransformationTool } from '../services/platform/types';

@Component({
  selector: 'app-transformation-tools',
  templateUrl: './transformation-tools.page.html',
  styleUrls: ['./transformation-tools.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    CardComponent,
  ],
})
export class TransformationToolsPage implements OnInit {
  tools: PlatformTransformationTool[] = [];
  loading = true;

  constructor(
    private router: Router,
    private platformApi: PlatformApiService
  ) {}

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

  getScriptureSubtitle(tool: PlatformTransformationTool): string {
    return (tool.scriptureRefs ?? []).join(' • ');
  }

  getExcerpt(tool: PlatformTransformationTool): string {
    const plain = (tool.introContent ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length <= 140) return plain;
    return `${plain.slice(0, 140).trim()}…`;
  }

  navigateToDetail(tool: PlatformTransformationTool) {
    this.router.navigate(['/tabs/transformation-tools', tool.id]);
  }
}
