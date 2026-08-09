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
  IonCard,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone';
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
    IonCard,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
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

  navigateToDetail(tool: PlatformTransformationTool) {
    this.router.navigate(['/tabs/transformation-tools', tool.id]);
  }
}
