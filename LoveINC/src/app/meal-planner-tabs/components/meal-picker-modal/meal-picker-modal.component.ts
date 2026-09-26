import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import type { CachedRecipe } from '@upstart-productions/meal-planner';
import {
  MealPlannerPlanService,
  MealPlannerProfileService,
  MealPlannerRecipeService,
} from '@upstart-productions/meal-planner';
import { ContentCardListComponent } from '../../../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../../../components/content-card-list/content-card-list.model';
import { MEAL_SEARCH_CATEGORIES } from '../../constants/meal-search-categories';
import { SpoonacularService } from '../../services/spoonacular.service';
import {
  mapCachedRecipeToListItem,
  mapSpoonacularResultToListItem,
} from '../../utils/meal-planner-list.mapper';
import { RecipeDetailModalComponent } from '../recipe-detail-modal/recipe-detail-modal.component';
import { SwipeUpToCloseDirective } from '../../../directives/swipe-up-to-close.directive';

@Component({
  selector: 'app-meal-picker-modal',
  templateUrl: './meal-picker-modal.component.html',
  styleUrls: ['./meal-picker-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSearchbar,
    IonIcon,
    ContentCardListComponent,
    LucideAngularModule,
    SwipeUpToCloseDirective,
  ],
})
export class MealPickerModalComponent implements OnInit {
  @Input() weekStartDate = '';
  @Input() slotIndex = 0;
  @ViewChild('categoryZone') categoryZone?: ElementRef<HTMLElement>;
  @ViewChild('categoryPanelSwipe') categoryPanelSwipe?: SwipeUpToCloseDirective;

  readonly categories = MEAL_SEARCH_CATEGORIES;
  /** Matches content-card large aside avatar icon scale. */
  readonly categoryIconSize = 34;

  searchQuery = '';
  selectedCategoryId: string | null = null;
  categoriesPanelOpen = false;
  categoriesAnimCollapsed = false;
  searching = false;
  loadingPick = false;
  showRecommendationsFirst = false;
  errorMessage = '';

  searchListItems: ContentCardListItem[] = [];
  favoriteListItems: ContentCardListItem[] = [];
  recommendationListItems: ContentCardListItem[] = [];

  private maxReadyMinutes = 45;

  constructor(
    private modalCtrl: ModalController,
    private spoonacular: SpoonacularService,
    private recipeService: MealPlannerRecipeService,
    private profileService: MealPlannerProfileService,
    private planService: MealPlannerPlanService
  ) {}

  get hasActiveSearch(): boolean {
    return Boolean(this.searchQuery.trim() || this.selectedCategoryId);
  }

  /** Favorites or library picks shown when search/category is idle. */
  get hasExistingMealsToPickFrom(): boolean {
    return (
      this.favoriteListItems.length > 0 ||
      (this.showRecommendationsFirst && this.recommendationListItems.length > 0)
    );
  }

  get collapsedTabCategory() {
    if (!this.selectedCategoryId) {
      return null;
    }
    return this.categories.find((item) => item.id === this.selectedCategoryId) ?? null;
  }

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    this.maxReadyMinutes = profile?.maxReadyMinutes ?? 45;

    const [count, recommendations, favorites] = await Promise.all([
      this.recipeService.getCachedRecipeCount(),
      this.recipeService.listRecommendations(),
      this.recipeService.listFavorites(),
    ]);
    this.showRecommendationsFirst = count >= 4;
    const cachedRecipeIds = [...favorites, ...recommendations]
      .map((recipe) => recipe.id)
      .filter((id): id is number => id != null);
    const ratings = await this.planService.getLatestStarRatingsForRecipes({ cachedRecipeIds });
    this.favoriteListItems = favorites.map((recipe) =>
      mapCachedRecipeToListItem(recipe, {
        starRating: recipe.id ? ratings.byCachedRecipeId.get(recipe.id) : undefined,
      })
    );
    this.recommendationListItems = recommendations.map((recipe) =>
      mapCachedRecipeToListItem(recipe, {
        starRating: recipe.id ? ratings.byCachedRecipeId.get(recipe.id) : undefined,
      })
    );
    this.categoriesAnimCollapsed = this.hasExistingMealsToPickFrom;
  }

  dismiss() {
    void this.modalCtrl.dismiss();
  }

  onSearchInput(event: CustomEvent) {
    this.searchQuery = String(event.detail.value ?? '');
    this.syncCategoryPanelState();
    void this.runSearch();
  }

  onSearchClear() {
    this.searchQuery = '';
    this.syncCategoryPanelState();
    void this.runSearch();
  }

  expandCategories() {
    this.categoryPanelSwipe?.reset();
    this.categoriesPanelOpen = true;

    if (!this.categoriesAnimCollapsed) {
      return;
    }

    this.scheduleCategoryExpand();
  }

  collapseCategories() {
    this.categoryPanelSwipe?.reset();
    this.categoriesPanelOpen = false;
    this.categoriesAnimCollapsed = true;
  }

  toggleCategory(categoryId: string) {
    this.selectedCategoryId = this.selectedCategoryId === categoryId ? null : categoryId;
    this.syncCategoryPanelState();
    void this.runSearch();
  }

  clearCategory() {
    this.selectedCategoryId = null;
    this.syncCategoryPanelState();
    void this.runSearch();
  }

  private syncCategoryPanelState() {
    this.categoriesPanelOpen = false;
    if (this.hasActiveSearch) {
      this.scheduleCategoryCollapse();
      return;
    }
    this.categoriesAnimCollapsed = this.hasExistingMealsToPickFrom;
  }

  private scheduleCategoryCollapse() {
    if (this.categoriesAnimCollapsed || this.categoriesPanelOpen) {
      return;
    }

    requestAnimationFrame(() => {
      void this.categoryZone?.nativeElement.offsetHeight;
      requestAnimationFrame(() => {
        if (this.hasActiveSearch && !this.categoriesPanelOpen) {
          this.categoriesAnimCollapsed = true;
        }
      });
    });
  }

  private scheduleCategoryExpand() {
    requestAnimationFrame(() => {
      void this.categoryZone?.nativeElement.offsetHeight;
      requestAnimationFrame(() => {
        this.categoriesAnimCollapsed = false;
        this.categoryPanelSwipe?.playEnterAnimation();
      });
    });
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryId === categoryId;
  }

  categoryIconColor(categoryId: string, baseColor: string): string {
    return this.isCategorySelected(categoryId) ? '#ffffff' : baseColor;
  }

  async onListItemClick(item: ContentCardListItem) {
    const fromSearch = this.searchListItems.some((row) => row.id === item.id);
    if (fromSearch) {
      await this.viewSearchResult(Number(item.id));
      return;
    }
    const cachedId = Number(item.id);
    if (!Number.isNaN(cachedId)) {
      void this.modalCtrl.dismiss({ cachedRecipeId: cachedId });
    }
  }

  private async runSearch() {
    const params = this.buildSearchParams();
    if (!params) {
      this.searchListItems = [];
      this.errorMessage = '';
      return;
    }

    this.searching = true;
    this.errorMessage = '';
    try {
      const results = await this.spoonacular.searchRecipes({
        ...params,
        maxReadyTime: this.maxReadyMinutes,
      });
      const spoonacularIds = results.map((result) => result.id);
      const [ratings, cachedReadyMinutes] = await Promise.all([
        this.planService.getLatestStarRatingsForRecipes({ spoonacularIds }),
        this.recipeService.getReadyMinutesBySpoonacularIds(spoonacularIds),
      ]);
      this.searchListItems = results.map((result) =>
        mapSpoonacularResultToListItem(
          {
            ...result,
            readyInMinutes: result.readyInMinutes ?? cachedReadyMinutes.get(result.id),
          },
          {
            starRating: ratings.bySpoonacularId.get(result.id),
          }
        )
      );
    } catch (err) {
      this.errorMessage =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Could not search recipes. Check your connection and API key.';
      this.searchListItems = [];
    } finally {
      this.searching = false;
    }
  }

  private buildSearchParams(): { query?: string; type?: string; diet?: string } | null {
    const userQuery = this.searchQuery.trim();
    const category = this.categories.find((item) => item.id === this.selectedCategoryId);
    const query = userQuery || category?.search.query;
    const type = category?.search.type;
    const diet = category?.search.diet;

    if (!query && !type && !diet) {
      return null;
    }

    return {
      query: query || undefined,
      type,
      diet,
    };
  }

  private async viewSearchResult(spoonacularId: number) {
    this.loadingPick = true;
    this.errorMessage = '';
    try {
      const cached = await this.spoonacular.fetchAndCacheRecipe(spoonacularId);
      if (!cached.id) {
        throw new Error('Failed to cache recipe');
      }

      const detailModal = await this.modalCtrl.create({
        component: RecipeDetailModalComponent,
        componentProps: {
          recipe: cached,
          weekStartDate: this.weekStartDate,
          slotIndex: this.slotIndex,
        },
      });
      await detailModal.present();
      const { data } = await detailModal.onDidDismiss<{
        addedToWeek?: boolean;
        cachedRecipeId?: number;
        removedFromWeek?: boolean;
        weekChanged?: boolean;
      }>();
      if (data?.removedFromWeek) {
        void this.modalCtrl.dismiss({ weekChanged: true });
        return;
      }
      if (data?.addedToWeek && data.cachedRecipeId) {
        void this.modalCtrl.dismiss({ cachedRecipeId: data.cachedRecipeId });
      }
    } catch {
      this.errorMessage = 'Could not load that recipe. Try again.';
    } finally {
      this.loadingPick = false;
    }
  }
}
