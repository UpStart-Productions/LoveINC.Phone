import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  getCurrentWeekStart,
  MealPlannerPlanService,
  type PlanMeal,
} from '@upstart-productions/meal-planner';
import { ContentCardComponent } from '../content-card/content-card.component';
import { GrovSeedsService } from '../../services/grov-seeds.service';
import { HomeClassToolsPreferenceService } from '../../services/home-class-tools-preference.service';

const MEAL_PLANNER_SEED_SLUG = 'meal-planner';

@Component({
  selector: 'app-meal-planner-home-widget',
  templateUrl: './meal-planner-home-widget.component.html',
  styleUrls: ['./meal-planner-home-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class MealPlannerHomeWidgetComponent implements OnInit, OnDestroy {
  @Output() visibleChange = new EventEmitter<boolean>();

  highlightMeal: PlanMeal | null = null;
  selectedCount = 0;
  loading = true;
  seedEnabled = false;
  prefVisible = true;
  private prefSub?: Subscription;

  constructor(
    private readonly planService: MealPlannerPlanService,
    private readonly grovSeeds: GrovSeedsService,
    private readonly homeClassTools: HomeClassToolsPreferenceService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.prefVisible = this.homeClassTools.isVisible();
    this.prefSub = this.homeClassTools.visibility$.subscribe((visible) => {
      this.prefVisible = visible;
      this.emitVisible();
      this.cdr.markForCheck();
    });
    void this.loadSnapshot();
  }

  ngOnDestroy(): void {
    this.prefSub?.unsubscribe();
  }

  refresh(): void {
    void this.loadSnapshot(true);
  }

  get cardTitle(): string {
    return this.highlightMeal?.recipe?.title?.trim() || 'Meal Planner';
  }

  get cardDetail(): string {
    const extra = this.selectedCount - 1;
    if (extra <= 0) {
      return '';
    }
    return extra === 1 ? '+1 more meal' : `+${extra} more meals`;
  }

  get cardImageUrl(): string | undefined {
    return this.highlightMeal?.recipe?.imageUrl?.trim() || undefined;
  }

  get showCard(): boolean {
    return this.prefVisible && this.seedEnabled && !this.loading && this.selectedCount > 0;
  }

  private async loadSnapshot(refreshSeed = false): Promise<void> {
    this.loading = true;
    this.emitVisible();
    try {
      this.seedEnabled = await firstValueFrom(
        this.grovSeeds.isSlugEnabled(MEAL_PLANNER_SEED_SLUG, refreshSeed),
      );
      if (!this.seedEnabled) {
        this.highlightMeal = null;
        this.selectedCount = 0;
        return;
      }

      const plan = await this.planService.getWeeklyPlan(getCurrentWeekStart());
      const meals = plan?.meals ?? [];
      const selected = meals.filter((meal) => meal.recipe);
      this.selectedCount = selected.length;
      this.highlightMeal = this.pickHighlightMeal(meals);
    } catch {
      this.highlightMeal = null;
      this.selectedCount = 0;
    } finally {
      this.loading = false;
      this.emitVisible();
      this.cdr.markForCheck();
    }
  }

  private pickHighlightMeal(meals: PlanMeal[]): PlanMeal | null {
    const selected = meals
      .filter((meal) => meal.recipe)
      .sort((a, b) => a.slotIndex - b.slotIndex);
    if (!selected.length) {
      return null;
    }
    return selected.find((meal) => !meal.isCooked) ?? selected[0];
  }

  private emitVisible(): void {
    this.visibleChange.emit(this.showCard);
  }
}
