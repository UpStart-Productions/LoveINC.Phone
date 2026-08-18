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
import { ContentPlanService } from '../content-plan/content-plan.service';
import {
  mapContentPlanToListItem,
  TOOLS_FOR_TRANSFORMATION_THEME_NAME,
} from '../content-plan/content-plan.mapper';

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
  listItems: ContentCardListItem[] = [];
  loading = true;

  constructor(private contentPlanService: ContentPlanService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  ionViewWillEnter(): void {
    if (!this.loading) {
      this.loadPlans(true);
    }
  }

  private loadPlans(refresh = false): void {
    this.loading = true;
    this.contentPlanService
      .getPlansByThemeName(TOOLS_FOR_TRANSFORMATION_THEME_NAME, refresh)
      .subscribe({
        next: (plans) => {
          this.listItems = plans.map((plan) =>
            mapContentPlanToListItem(plan, {
              navigationFrom: 'transformation-tools',
              showThemeCategory: false,
              createdAtInlineWithAuthor: true,
            })
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading Tools for Transformation plans:', err);
          this.listItems = [];
          this.loading = false;
        },
      });
  }
}
