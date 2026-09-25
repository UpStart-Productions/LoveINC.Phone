import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  ActionSheetController,
  ModalController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
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
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    AppBackButtonComponent,
    MealWeekScrollerComponent,
  ],
})
export class MealPlannerCookPage implements OnInit, OnDestroy {
  loading = true;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  weekLabel = '';
  plan: WeeklyPlan | null = null;
  meals: PlanMeal[] = [];
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

  async viewRecipe(meal: PlanMeal) {
    if (!meal.recipe) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: RecipeDetailModalComponent,
      componentProps: {
        recipe: meal.recipe,
        planMealId: meal.id,
        extraGuests: meal.extraGuests,
      },
    });
    await modal.present();
  }

  async markCooked(meal: PlanMeal) {
    if (!meal.id) {
      return;
    }
    if (meal.isCooked) {
      await this.planService.unmarkMealCooked(meal.id);
      await this.loadWeek();
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

  private async pickReaction(meal: PlanMeal, cookTimeBucket: string) {
    const reactionSheet = await this.actionSheetCtrl.create({
      header: 'How was it?',
      buttons: [
        ...REACTION_OPTIONS.map((option) => ({
          text: `${option.emoji} ${option.label}`,
          handler: () => {
            void this.planService.markMealCooked(meal.id!, cookTimeBucket, option.emoji).then(() =>
              this.loadWeek()
            );
          },
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await reactionSheet.present();
  }

  private async loadWeek() {
    this.loading = true;
    try {
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
      this.plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      this.meals = this.plan?.meals ?? [];
    } finally {
      this.loading = false;
    }
  }
}
