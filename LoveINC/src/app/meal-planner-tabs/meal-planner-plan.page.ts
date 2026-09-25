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
  IonIcon,
  ModalController,
  AlertController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import {
  MEALS_PER_WEEK,
  MealPlannerPlanService,
  MealPlannerProfileService,
  formatWeekLabel,
  getCurrentWeekStart,
  type PlanMeal,
  type WeeklyPlan,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { MealPickerModalComponent } from './components/meal-picker-modal/meal-picker-modal.component';
import { WeekSettingsModalComponent } from './components/week-settings-modal/week-settings-modal.component';
import { RecipeDetailModalComponent } from './components/recipe-detail-modal/recipe-detail-modal.component';
import { MealPlannerStateService } from './services/meal-planner-state.service';
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
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonIcon,
    AppBackButtonComponent,
    MealWeekScrollerComponent,
  ],
})
export class MealPlannerPlanPage implements OnInit, OnDestroy {
  loading = true;
  needsProfile = false;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  weekLabel = '';
  plan: WeeklyPlan | null = null;
  slots: Array<PlanMeal | null> = [null, null, null];
  private weekSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private profileService: MealPlannerProfileService,
    private stateService: MealPlannerStateService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
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
      componentProps: {
        weekServingDelta: this.plan?.weekServingDelta ?? 0,
        weekNote: this.plan?.weekNote ?? '',
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data) {
      return;
    }
    await this.profileService.saveProfile(data.profile);
    this.needsProfile = false;
    await this.planService.updateWeekAdjustments(
      this.selectedWeekStart,
      data.weekServingDelta,
      data.weekNote
    );
    await this.loadWeek();
  }

  async onSetupProfile() {
    await this.openSettings();
  }

  async pickMeal(slotIndex: number) {
    const modal = await this.modalCtrl.create({
      component: MealPickerModalComponent,
      componentProps: { slotLabel: `Meal ${slotIndex + 1}` },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ cachedRecipeId: number }>();
    if (!data?.cachedRecipeId) {
      return;
    }
    this.plan = await this.planService.setMealForSlot(
      this.selectedWeekStart,
      slotIndex,
      data.cachedRecipeId
    );
    this.syncSlots();
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

  async editMealGuests(meal: PlanMeal) {
    if (!meal.id) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Guests for this meal',
      inputs: [
        {
          name: 'extraGuests',
          type: 'number',
          placeholder: 'Extra guests',
          value: String(meal.extraGuests ?? 0),
        },
        {
          name: 'eventNote',
          type: 'text',
          placeholder: 'Note (optional)',
          value: meal.eventNote ?? '',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (values) => {
            void this.planService.updateMealGuests(
              meal.id!,
              Math.max(0, Number(values['extraGuests']) || 0),
              values['eventNote']
            ).then(() => this.loadWeek());
          },
        },
      ],
    });
    await alert.present();
  }

  private async loadWeek() {
    this.loading = true;
    try {
      const profile = await this.profileService.getProfile();
      this.needsProfile = !profile;
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
      this.plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      this.syncSlots();
    } finally {
      this.loading = false;
    }
  }

  private syncSlots() {
    this.slots = Array.from({ length: MEALS_PER_WEEK }, (_, slotIndex) => {
      return this.plan?.meals.find((meal) => meal.slotIndex === slotIndex) ?? null;
    });
  }
}
