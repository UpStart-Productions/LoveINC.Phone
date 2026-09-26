import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import {
  MEALS_PER_WEEK,
  MealPlannerPlanService,
  MealPlannerProfileService,
  getCurrentWeekStart,
  type PlanMeal,
  type WeeklyPlan,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { MealPickerModalComponent } from './components/meal-picker-modal/meal-picker-modal.component';
import { WeekSettingsModalComponent } from './components/week-settings-modal/week-settings-modal.component';
import { RecipeDetailModalComponent } from './components/recipe-detail-modal/recipe-detail-modal.component';
import { MealPlannerStateService } from './services/meal-planner-state.service';
import {
  mapEmptyMealSlot,
  mapPlanMealToListItem,
} from './utils/meal-planner-list.mapper';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-meal-planner-plan',
  templateUrl: './meal-planner-plan.page.html',
  styleUrls: ['./meal-planner-plan.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    AppBackButtonComponent,
    MealWeekScrollerComponent,
    ContentCardListComponent,
  ],
})
export class MealPlannerPlanPage implements OnInit, OnDestroy {
  loading = true;
  needsProfile = false;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  plan: WeeklyPlan | null = null;
  householdSize = 2;
  slots: Array<PlanMeal | null> = [null, null, null];
  listItems: ContentCardListItem[] = [];
  private weekSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private profileService: MealPlannerProfileService,
    private stateService: MealPlannerStateService,
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

  async onWeekSelected(weekStartDate: string) {
    this.stateService.setSelectedWeekStart(weekStartDate);
  }

  async openSettings() {
    const modal = await this.modalCtrl.create({
      component: WeekSettingsModalComponent,
      cssClass: 'week-settings-sheet',
      breakpoints: [0, 0.58],
      initialBreakpoint: 0.58,
      backdropDismiss: true,
      componentProps: {
        weekStartDate: this.selectedWeekStart,
        weekServingDelta: this.plan?.weekServingDelta ?? 0,
        weekNote: this.plan?.weekNote ?? '',
        mealsPerWeek: this.plan?.mealsPerWeek ?? MEALS_PER_WEEK,
      },
    });
    await modal.present();
    await modal.onDidDismiss();
    this.needsProfile = false;
    await this.loadWeek();
    this.stateService.notifyWeeklyPlanChanged(this.selectedWeekStart);
  }

  async onSetupProfile() {
    await this.openSettings();
  }

  async onMealRowClick(item: ContentCardListItem) {
    const slotIndex = Number(item.id?.replace('slot-', ''));
    if (Number.isNaN(slotIndex)) {
      return;
    }
    const meal = this.slots[slotIndex];
    if (!meal?.recipe) {
      await this.pickMeal(slotIndex);
      return;
    }
    await this.viewRecipe(meal, slotIndex);
  }

  async pickMeal(slotIndex: number) {
    const modal = await this.modalCtrl.create({
      component: MealPickerModalComponent,
      componentProps: {
        weekStartDate: this.selectedWeekStart,
        slotIndex,
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ cachedRecipeId?: number; weekChanged?: boolean }>();
    if (data?.weekChanged) {
      await this.loadWeek();
      this.stateService.notifyWeeklyPlanChanged(this.selectedWeekStart);
    }
    if (!data?.cachedRecipeId) {
      return;
    }
    this.plan = await this.planService.setMealForSlot(
      this.selectedWeekStart,
      slotIndex,
      data.cachedRecipeId
    );
    this.syncSlots();
    this.stateService.notifyWeeklyPlanChanged(this.selectedWeekStart);
  }

  async viewRecipe(meal: PlanMeal, slotIndex: number) {
    if (!meal.recipe) {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: RecipeDetailModalComponent,
      componentProps: {
        recipe: meal.recipe,
        weekStartDate: this.selectedWeekStart,
        slotIndex,
        planMealId: meal.id,
        extraGuests: meal.extraGuests,
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ weekChanged?: boolean }>();
    if (data?.weekChanged) {
      await this.loadWeek();
      this.stateService.notifyWeeklyPlanChanged(this.selectedWeekStart);
    }
  }

  private async loadWeek() {
    this.loading = true;
    try {
      const profile = await this.profileService.getProfile();
      this.needsProfile = !profile;
      this.householdSize = profile?.householdSize ?? 2;
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      this.syncSlots();
    } finally {
      this.loading = false;
    }
  }

  private syncSlots() {
    const mealsPerWeek = this.plan?.mealsPerWeek ?? MEALS_PER_WEEK;
    this.slots = Array.from({ length: mealsPerWeek }, (_, slotIndex) => {
      return this.plan?.meals.find((meal) => meal.slotIndex === slotIndex) ?? null;
    });
    const weekServingDelta = this.plan?.weekServingDelta ?? 0;
    this.listItems = this.slots.map((meal, slotIndex) =>
      meal
        ? mapPlanMealToListItem(meal, slotIndex, this.householdSize, weekServingDelta)
        : mapEmptyMealSlot(slotIndex)
    );
  }
}
