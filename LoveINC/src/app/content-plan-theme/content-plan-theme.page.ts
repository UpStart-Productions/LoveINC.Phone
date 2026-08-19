import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
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
import { ContentPlanService } from '../content-plan/content-plan.service';
import { mapContentPlanToListItem } from '../content-plan/content-plan.mapper';

@Component({
  selector: 'app-content-plan-theme-page',
  templateUrl: './content-plan-theme.page.html',
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
export class ContentPlanThemePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contentPlanService = inject(ContentPlanService);

  listItems: ContentCardListItem[] = [];
  pageTitle = 'Learning';
  loading = true;

  ngOnInit(): void {
    this.loadTheme();
  }

  ionViewWillEnter(): void {
    if (!this.loading) {
      this.loadTheme(true);
    }
  }

  private loadTheme(refresh = false): void {
    const themeId = this.route.snapshot.paramMap.get('themeId')?.trim() ?? '';
    if (!themeId) {
      this.listItems = [];
      this.pageTitle = 'Learning';
      this.loading = false;
      return;
    }

    this.loading = true;
    forkJoin({
      theme: this.contentPlanService.getThemeById(themeId, refresh),
      plans: this.contentPlanService.getPlansByThemeId(themeId, refresh),
    }).subscribe({
      next: ({ theme, plans }) => {
        this.pageTitle = theme?.name?.trim() || 'Learning';
        this.listItems = plans.map((plan) =>
          mapContentPlanToListItem(plan, {
            navigationFrom: 'content-plan-theme',
            showThemeCategory: false,
            createdAtInlineWithAuthor: true,
          })
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading content plan theme:', err);
        this.pageTitle = 'Learning';
        this.listItems = [];
        this.loading = false;
      },
    });
  }
}
