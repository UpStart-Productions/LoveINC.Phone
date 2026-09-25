import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  ModalController,
} from '@ionic/angular/standalone';
import type { CachedRecipe } from '@upstart-productions/meal-planner';
import {
  MealPlannerPlanService,
  MealPlannerProfileService,
  MealPlannerRecipeService,
} from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-recipe-detail-modal',
  templateUrl: './recipe-detail-modal.component.html',
  styleUrls: ['./recipe-detail-modal.component.scss'],
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
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class RecipeDetailModalComponent implements OnInit, AfterViewInit, OnDestroy {
  actionsOpen = false;
  actionsEvent?: Event;
  @Input() recipe!: CachedRecipe;
  @Input() weekStartDate?: string;
  @Input() slotIndex?: number;
  @Input() planMealId?: number;
  @Input() extraGuests = 0;

  @ViewChild('ionContent') private ionContent?: IonContent;

  isFavorite = false;
  isOnWeek = false;
  edgeHeaderScrolled = false;
  householdSize = 2;
  weekServingDelta = 0;
  weekChanged = false;

  private edgeScrollEl: HTMLElement | null = null;
  private edgeScrollListener: (() => void) | null = null;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private recipeService: MealPlannerRecipeService,
    private planService: MealPlannerPlanService,
    private profileService: MealPlannerProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  get showEdgeHero(): boolean {
    return Boolean(this.recipe.imageUrl?.trim());
  }

  get showStandardHeader(): boolean {
    return !this.showEdgeHero;
  }

  get canManageWeek(): boolean {
    return Boolean(this.weekStartDate) && this.slotIndex != null;
  }

  get displayServings(): number {
    if (this.canManageWeek && this.isOnWeek) {
      return this.householdSize + this.weekServingDelta + this.extraGuests;
    }
    return this.recipe.servings;
  }

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    this.householdSize = profile?.householdSize ?? 2;

    if (this.recipe.id) {
      this.isFavorite = await this.recipeService.isFavorite(this.recipe.id);
    }

    if (this.planMealId) {
      this.isOnWeek = true;
    }

    await this.loadWeekContext();
  }

  ngAfterViewInit() {
    void this.syncEdgeHeaderScrollListener();
  }

  ngOnDestroy() {
    this.teardownEdgeHeaderScrollListener();
  }

  dismiss() {
    void this.modalCtrl.dismiss({
      weekChanged: this.weekChanged,
      addedToWeek: this.isOnWeek,
      cachedRecipeId: this.isOnWeek ? this.recipe.id : undefined,
    });
  }

  openActions(event: Event) {
    event.stopPropagation();
    this.actionsEvent = event;
    this.actionsOpen = true;
  }

  async selectWeekAction(event: Event, popover: IonPopover) {
    event.stopPropagation();
    await popover.dismiss();
    this.actionsOpen = false;
    await this.toggleWeek();
  }

  async selectFavoriteAction(event: Event, popover: IonPopover) {
    event.stopPropagation();
    await popover.dismiss();
    this.actionsOpen = false;
    await this.toggleFavorite();
  }

  async selectServingsAction(event: Event, popover: IonPopover) {
    event.stopPropagation();
    await popover.dismiss();
    this.actionsOpen = false;
    await this.editServings();
  }

  async toggleWeek() {
    if (!this.recipe.id || !this.weekStartDate || this.slotIndex == null) {
      return;
    }

    if (this.isOnWeek) {
      await this.planService.clearMealForSlot(this.weekStartDate, this.slotIndex);
      this.isOnWeek = false;
      this.planMealId = undefined;
      this.extraGuests = 0;
    } else {
      const plan = await this.planService.setMealForSlot(
        this.weekStartDate,
        this.slotIndex,
        this.recipe.id
      );
      const meal = plan.meals.find((row) => row.slotIndex === this.slotIndex);
      this.isOnWeek = true;
      this.planMealId = meal?.id;
      this.extraGuests = meal?.extraGuests ?? 0;
    }

    this.weekChanged = true;
  }

  async toggleFavorite() {
    if (!this.recipe.id) {
      return;
    }
    this.isFavorite = !this.isFavorite;
    await this.recipeService.setFavorite(this.recipe.id, this.isFavorite);
  }

  async editServings() {
    if (!this.isOnWeek || !this.planMealId) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Servings for this meal',
      inputs: [
        {
          name: 'servings',
          type: 'text',
          attributes: {
            inputmode: 'numeric',
          },
          placeholder: 'Total servings',
          value: String(this.displayServings),
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: (values) => {
            void this.applyServings(values?.['servings']);
          },
        },
      ],
    });
    await alert.present();
  }

  private async applyServings(rawValue: unknown) {
    const planMealId = this.planMealId;
    if (!planMealId) {
      return;
    }

    const total = Math.max(1, Number(rawValue) || 1);
    const baseServings = this.householdSize + this.weekServingDelta;
    const extraGuests = Math.max(0, total - baseServings);

    await this.planService.updateMealGuests(planMealId, extraGuests);
    this.extraGuests = extraGuests;
    this.weekChanged = true;
    this.cdr.markForCheck();
  }

  private async loadWeekContext() {
    if (!this.weekStartDate || this.slotIndex == null) {
      return;
    }

    const plan = await this.planService.getWeeklyPlan(this.weekStartDate);
    this.weekServingDelta = plan?.weekServingDelta ?? 0;

    const meal = plan?.meals.find((row) => row.slotIndex === this.slotIndex);
    if (meal && meal.cachedRecipeId === this.recipe.id) {
      this.isOnWeek = true;
      this.planMealId = meal.id;
      this.extraGuests = meal.extraGuests;
    }
  }

  private async syncEdgeHeaderScrollListener(): Promise<void> {
    this.teardownEdgeHeaderScrollListener();

    if (!this.showEdgeHero || !this.ionContent) {
      this.edgeHeaderScrolled = false;
      this.cdr.markForCheck();
      return;
    }

    const scrollEl = await this.ionContent.getScrollElement();
    const onScroll = (): void => {
      const scrolled = scrollEl.scrollTop > 5;
      if (this.edgeHeaderScrolled === scrolled) {
        return;
      }
      this.edgeHeaderScrolled = scrolled;
      this.cdr.markForCheck();
    };

    this.edgeScrollEl = scrollEl;
    this.edgeScrollListener = onScroll;
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  private teardownEdgeHeaderScrollListener(): void {
    if (this.edgeScrollEl && this.edgeScrollListener) {
      this.edgeScrollEl.removeEventListener('scroll', this.edgeScrollListener);
    }
    this.edgeScrollEl = null;
    this.edgeScrollListener = null;
  }
}
