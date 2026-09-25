import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import {
  COOK_TIME_OPTIONS,
  MealPlannerPlanService,
  formatWeekLabel,
  getCurrentWeekStart,
  type PlanMeal,
  type WeeklySummary,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { MealPlannerStateService } from './services/meal-planner-state.service';
import { mapSummaryMealToListItem } from './utils/meal-planner-list.mapper';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-meal-planner-summary',
  templateUrl: './meal-planner-summary.page.html',
  styleUrls: ['./meal-planner-summary.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    AppBackButtonComponent,
    MealWeekScrollerComponent,
    ContentCardListComponent,
  ],
})
export class MealPlannerSummaryPage implements OnInit, OnDestroy {
  loading = true;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  weekLabel = '';
  summary: WeeklySummary | null = null;
  meals: PlanMeal[] = [];
  listItems: ContentCardListItem[] = [];
  private weekSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private stateService: MealPlannerStateService
  ) {}

  async ngOnInit() {
    this.selectedWeekStart = this.stateService.getSelectedWeekStart();
    this.weekSub = this.stateService.watchSelectedWeekStart().subscribe((week) => {
      this.selectedWeekStart = week;
      void this.loadWeek();
    });
    await this.loadWeek();
  }

  ngOnDestroy() {
    this.weekSub?.unsubscribe();
  }

  onWeekSelected(weekStartDate: string) {
    this.stateService.setSelectedWeekStart(weekStartDate);
  }

  private cookTimeLabel(bucket?: string): string {
    return COOK_TIME_OPTIONS.find((option) => option.bucket === bucket)?.label ?? bucket ?? '';
  }

  private async loadWeek() {
    this.loading = true;
    try {
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
      this.summary = await this.planService.getWeeklySummary(this.selectedWeekStart);
      const plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      this.meals = plan?.meals ?? [];
      this.listItems = this.meals.map((meal) =>
        mapSummaryMealToListItem(
          meal,
          meal.isCooked
            ? `${meal.reactionEmoji ?? ''} · ${this.cookTimeLabel(meal.cookTimeBucket)}`.trim()
            : 'Not cooked yet'
        )
      );
    } finally {
      this.loading = false;
    }
  }
}
