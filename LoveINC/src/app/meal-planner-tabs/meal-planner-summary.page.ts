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
  MealPlannerPlanService,
  MealPlannerProfileService,
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
  householdSize = 2;
  weekServingDelta = 0;
  private weekSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private profileService: MealPlannerProfileService,
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

  private mealDetail(meal: PlanMeal): string | undefined {
    const recipe = meal.recipe;
    if (!recipe) {
      return undefined;
    }

    const parts: string[] = [];
    if (recipe.readyInMinutes) {
      parts.push(`${recipe.readyInMinutes} min`);
    }
    const totalServings = this.householdSize + this.weekServingDelta + meal.extraGuests;
    parts.push(`Serves ${totalServings}`);
    return parts.length ? parts.join(' · ') : undefined;
  }

  private async loadWeek() {
    this.loading = true;
    try {
      const profile = await this.profileService.getProfile();
      this.householdSize = profile?.householdSize ?? 2;
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
      this.summary = await this.planService.getWeeklySummary(this.selectedWeekStart);
      const plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      this.weekServingDelta = plan?.weekServingDelta ?? 0;
      this.meals = plan?.meals ?? [];
      this.listItems = this.meals.map((meal) => mapSummaryMealToListItem(meal, this.mealDetail(meal)));
    } finally {
      this.loading = false;
    }
  }
}
