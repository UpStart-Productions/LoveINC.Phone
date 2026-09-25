import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  ActionSheetController,
  ModalController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import {
  COOK_TIME_OPTIONS,
  REACTION_OPTIONS,
  MealPlannerPlanService,
  formatWeekLabel,
  getCurrentWeekStart,
  type PlanMeal,
  type WeeklyPlan,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { RecipeDetailModalComponent } from './components/recipe-detail-modal/recipe-detail-modal.component';
import { MealPlannerStateService } from './services/meal-planner-state.service';
import { mapCookMealToListItem } from './utils/meal-planner-list.mapper';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-meal-planner-cook',
  templateUrl: './meal-planner-cook.page.html',
  styleUrls: ['./meal-planner-cook.page.scss'],
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
export class MealPlannerCookPage implements OnInit, OnDestroy {
  loading = true;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  weekLabel = '';
  plan: WeeklyPlan | null = null;
  meals: PlanMeal[] = [];
  listItems: ContentCardListItem[] = [];
  private weekSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private stateService: MealPlannerStateService,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController
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

  async onMealRowClick(item: ContentCardListItem) {
    const meal = this.meals.find((m) => String(m.id) === item.id);
    if (!meal) {
      return;
    }
    const buttons = [
      {
        text: 'View recipe',
        handler: () => {
          void this.viewRecipe(meal);
        },
      },
      meal.isCooked
        ? {
            text: 'Undo cooked',
            handler: () => {
              void this.unmarkCooked(meal);
            },
          }
        : {
            text: 'Mark as cooked',
            handler: () => {
              void this.markCooked(meal);
            },
          },
      { text: 'Cancel', role: 'cancel' as const },
    ];
    const sheet = await this.actionSheetCtrl.create({
      header: meal.recipe?.title ?? 'Meal',
      buttons,
    });
    await sheet.present();
  }

  async viewRecipe(meal: PlanMeal) {
    if (!meal.recipe) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: RecipeDetailModalComponent,
      componentProps: {
        recipe: meal.recipe,
        weekStartDate: this.selectedWeekStart,
        slotIndex: meal.slotIndex,
        planMealId: meal.id,
        extraGuests: meal.extraGuests,
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ weekChanged?: boolean }>();
    if (data?.weekChanged) {
      await this.loadWeek();
    }
  }

  async markCooked(meal: PlanMeal) {
    if (!meal.id) {
      return;
    }
    const timeSheet = await this.actionSheetCtrl.create({
      header: 'How long did it take?',
      buttons: [
        ...COOK_TIME_OPTIONS.map((option) => ({
          text: option.label,
          handler: () => {
            void this.pickReaction(meal, option.bucket);
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await timeSheet.present();
  }

  private async unmarkCooked(meal: PlanMeal) {
    if (!meal.id) {
      return;
    }
    await this.planService.unmarkMealCooked(meal.id);
    await this.loadWeek();
  }

  private async pickReaction(meal: PlanMeal, cookTimeBucket: string) {
    const reactionSheet = await this.actionSheetCtrl.create({
      header: 'How was it?',
      buttons: [
        ...REACTION_OPTIONS.map((option) => ({
          text: `${option.emoji} ${option.label}`,
          handler: () => {
            void this.planService
              .markMealCooked(meal.id!, cookTimeBucket, option.emoji)
              .then(() => this.loadWeek());
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await reactionSheet.present();
  }

  private cookTimeLabel(bucket?: string): string {
    return COOK_TIME_OPTIONS.find((option) => option.bucket === bucket)?.label ?? bucket ?? '';
  }

  private async loadWeek() {
    this.loading = true;
    try {
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
      this.plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      this.meals = this.plan?.meals ?? [];
      this.listItems = this.meals.map((meal) =>
        mapCookMealToListItem(
          meal,
          meal.isCooked
            ? `${meal.reactionEmoji ?? ''} ${this.cookTimeLabel(meal.cookTimeBucket)}`.trim()
            : undefined
        )
      );
    } finally {
      this.loading = false;
    }
  }
}
