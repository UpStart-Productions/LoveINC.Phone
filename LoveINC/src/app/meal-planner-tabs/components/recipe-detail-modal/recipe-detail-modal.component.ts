import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
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
  ToastController,
} from '@ionic/angular/standalone';
import type { CachedRecipe } from '@upstart-productions/meal-planner';
import {
  formatScaledIngredientLine,
  getRecipeScaleFactor,
  getTargetServings,
  type IngredientLineDisplay,
  MealPlannerPlanService,
  MealPlannerProfileService,
  MealPlannerRecipeService,
  parseIngredientLineForDisplay,
} from '@upstart-productions/meal-planner';
import { PdfService } from '../../../services/pdf.service';
import { SharingService } from '../../../services/sharing/sharing.service';
import {
  buildRecipePdfDocDefinition,
  buildRecipePdfFilename,
  buildRecipeShareHtml,
} from '../../utils/recipe-detail-pdf.util';
import { LucideAngularModule } from 'lucide-angular';
import { MealRecapSheetComponent } from '../meal-recap-sheet/meal-recap-sheet.component';
import { RecipeNutritionModalComponent } from '../recipe-nutrition-modal/recipe-nutrition-modal.component';
import { MealStarRatingComponent } from '../meal-star-rating/meal-star-rating.component';
import type { MealRecapThumb } from '@upstart-productions/meal-planner';
import { MEAL_RECIPE_ATTRIBUTION } from '../../config/meal-recipe-provider.config';
import { nutritionFactsForDisplay } from '../../utils/myplate-nutrition.util';
import type { RecipeNutritionFact } from '@upstart-productions/meal-planner';

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
    LucideAngularModule,
    MealStarRatingComponent,
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
  exporting = false;
  sharing = false;
  readonly recipeAttribution = MEAL_RECIPE_ATTRIBUTION;
  mealRecapReactionEmoji?: string;
  mealRecapEffortRating?: MealRecapThumb;
  mealRecapTimeRating?: MealRecapThumb;
  mealRecapCostRating?: MealRecapThumb;
  mealRecapNotes?: string;
  mealStarRating?: number;

  private edgeScrollEl: HTMLElement | null = null;
  private edgeScrollListener: (() => void) | null = null;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private recipeService: MealPlannerRecipeService,
    private planService: MealPlannerPlanService,
    private profileService: MealPlannerProfileService,
    private pdfService: PdfService,
    private sharingService: SharingService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private toastCtrl: ToastController
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
    if (this.shouldScaleRecipe) {
      return getTargetServings(this.householdSize, this.weekServingDelta, this.extraGuests);
    }
    return this.recipe.servings;
  }

  get shouldScaleRecipe(): boolean {
    return this.canManageWeek && this.isOnWeek;
  }

  get displayNutrition(): RecipeNutritionFact[] {
    return nutritionFactsForDisplay(this.recipe.nutrition);
  }

  get displayIngredients(): IngredientLineDisplay[] {
    const scale = this.shouldScaleRecipe
      ? getRecipeScaleFactor(this.recipe.servings, this.displayServings)
      : 1;
    return this.recipe.ingredients.map((ingredient) => {
      const line = formatScaledIngredientLine(ingredient, scale);
      return parseIngredientLineForDisplay(line);
    });
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

  async selectIMadeThisAction(event: Event, popover: IonPopover) {
    event.stopPropagation();
    await popover.dismiss();
    this.actionsOpen = false;
    await this.openMealRecapSheet();
  }

  async selectNutritionAction(event: Event, popover: IonPopover) {
    event.stopPropagation();
    await popover.dismiss();
    this.actionsOpen = false;
    await this.openNutritionModal();
  }

  async openNutritionModal(): Promise<void> {
    if (!this.displayNutrition.length) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: RecipeNutritionModalComponent,
      cssClass: 'recipe-nutrition-sheet',
      breakpoints: [0, 0.58],
      initialBreakpoint: 0.58,
      backdropDismiss: true,
      componentProps: {
        facts: this.displayNutrition,
      },
    });
    await modal.present();
  }

  private async openMealRecapSheet() {
    if (!this.planMealId) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: MealRecapSheetComponent,
      cssClass: 'meal-recap-sheet',
      breakpoints: [0, 0.58],
      initialBreakpoint: 0.58,
      backdropDismiss: true,
      componentProps: {
        planMealId: this.planMealId,
        initialReactionEmoji: this.mealRecapReactionEmoji,
        initialEffortRating: this.mealRecapEffortRating,
        initialTimeRating: this.mealRecapTimeRating,
        initialCostRating: this.mealRecapCostRating,
        initialNotes: this.mealRecapNotes,
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ saved?: boolean }>();
    if (data?.saved) {
      this.weekChanged = true;
      await this.loadWeekContext();
    }
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
      this.weekChanged = true;
      void this.modalCtrl.dismiss({
        weekChanged: true,
        removedFromWeek: true,
        addedToWeek: false,
      });
      return;
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
      await this.showActionToast('Selected for this week');
    }

    this.weekChanged = true;
  }

  async toggleFavorite() {
    if (!this.recipe.id) {
      return;
    }
    this.isFavorite = !this.isFavorite;
    await this.recipeService.setFavorite(this.recipe.id, this.isFavorite);
    if (this.isFavorite) {
      await this.showActionToast('Favorited');
    }
  }

  private async showActionToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
    });
    await toast.present();
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

  async exportPdf() {
    if (this.exporting || this.sharing) {
      return;
    }
    this.exporting = true;
    try {
      const filePath = await this.createAndSavePdf();
      await this.pdfService.openPdfInNativeViewer(filePath);
    } catch (err) {
      await this.presentExportAlert('Export failed', this.getErrorMessage(err));
    } finally {
      this.resetActionState('exporting');
    }
  }

  async shareRecipe() {
    if (this.exporting || this.sharing) {
      return;
    }
    this.sharing = true;
    try {
      const shareInput = {
        title: this.recipe.title,
        readyInMinutes: this.recipe.readyInMinutes,
        servings: this.displayServings,
        ingredients: this.displayIngredients,
        instructions: this.recipe.instructions,
      };

      await this.sharingService.shareContent({
        title: this.recipe.title,
        subject: `Recipe: ${this.recipe.title}`,
        htmlContent: buildRecipeShareHtml(shareInput),
        actionSheetHeader: 'Share Recipe',
        pdfShare: {
          subject: this.recipe.title,
          body: this.buildShareSubtitle(),
          generate: async () => {
            const filePath = await this.createAndSavePdf();
            return {
              filePath,
              filename: buildRecipePdfFilename(this.recipe.title),
            };
          },
        },
      });
    } catch (err) {
      await this.presentExportAlert('Share failed', this.getErrorMessage(err));
    } finally {
      this.resetActionState('sharing');
    }
  }

  private async createAndSavePdf(): Promise<string> {
    const docDefinition = buildRecipePdfDocDefinition({
      title: this.recipe.title,
      readyInMinutes: this.recipe.readyInMinutes,
      servings: this.displayServings,
      ingredients: this.displayIngredients,
      instructions: this.recipe.instructions,
    });
    const filename = buildRecipePdfFilename(this.recipe.title);
    const pdfDoc = this.pdfService.createPdfFromDefinition(docDefinition);
    return this.pdfService.savePdfToDevice(pdfDoc, filename);
  }

  private buildShareSubtitle(): string {
    const parts: string[] = [];
    if (this.recipe.readyInMinutes) {
      parts.push(`${this.recipe.readyInMinutes} min`);
    }
    parts.push(`Serves ${this.displayServings}`);
    return parts.join(' · ');
  }

  private resetActionState(field: 'exporting' | 'sharing'): void {
    this.ngZone.run(() => {
      this[field] = false;
    });
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }
    return 'Something went wrong while creating the PDF.';
  }

  private isShareCancelled(err: unknown): boolean {
    const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    return message.includes('cancel') || message.includes('dismiss');
  }

  private async presentExportAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
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
      this.mealRecapReactionEmoji = meal.reactionEmoji;
      this.mealRecapEffortRating = meal.effortRating;
      this.mealRecapTimeRating = meal.timeRating;
      this.mealRecapCostRating = meal.costRating;
      this.mealRecapNotes = meal.recapNotes;
      this.mealStarRating = meal.starRating;
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
