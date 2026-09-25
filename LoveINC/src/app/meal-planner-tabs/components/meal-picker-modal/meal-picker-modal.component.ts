import { Component, Input, OnInit } from '@angular/core';
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
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  ModalController,
} from '@ionic/angular/standalone';
import type { CachedRecipe, SpoonacularSearchResult } from '@upstart-productions/meal-planner';
import { MealPlannerProfileService, MealPlannerRecipeService } from '@upstart-productions/meal-planner';
import { SpoonacularService } from '../../services/spoonacular.service';

@Component({
  selector: 'app-meal-picker-modal',
  templateUrl: './meal-picker-modal.component.html',
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
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
  ],
})
export class MealPickerModalComponent implements OnInit {
  @Input() slotLabel = 'Meal';

  query = '';
  searching = false;
  loadingPick = false;
  searchResults: SpoonacularSearchResult[] = [];
  recommendations: CachedRecipe[] = [];
  favorites: CachedRecipe[] = [];
  showRecommendationsFirst = false;
  errorMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private spoonacular: SpoonacularService,
    private recipeService: MealPlannerRecipeService,
    private profileService: MealPlannerProfileService
  ) {}

  async ngOnInit() {
    const [count, recommendations, favorites] = await Promise.all([
      this.recipeService.getCachedRecipeCount(),
      this.recipeService.listRecommendations(),
      this.recipeService.listFavorites(),
    ]);
    this.showRecommendationsFirst = count >= 4;
    this.recommendations = recommendations;
    this.favorites = favorites;
  }

  dismiss() {
    void this.modalCtrl.dismiss();
  }

  async onSearch(event: CustomEvent) {
    this.query = String(event.detail.value ?? '').trim();
    if (!this.query) {
      this.searchResults = [];
      return;
    }
    this.searching = true;
    this.errorMessage = '';
    try {
      const profile = await this.profileService.getProfile();
      this.searchResults = await this.spoonacular.searchRecipes(
        this.query,
        profile?.maxReadyMinutes ?? 45
      );
    } catch {
      this.errorMessage = 'Could not search recipes. Check your connection and API key.';
      this.searchResults = [];
    } finally {
      this.searching = false;
    }
  }

  async pickSpoonacularResult(result: SpoonacularSearchResult) {
    await this.pickBySpoonacularId(result.id);
  }

  async pickCachedRecipe(recipe: CachedRecipe) {
    if (!recipe.id) {
      await this.pickBySpoonacularId(recipe.spoonacularId);
      return;
    }
    void this.modalCtrl.dismiss({ cachedRecipeId: recipe.id });
  }

  private async pickBySpoonacularId(spoonacularId: number) {
    this.loadingPick = true;
    this.errorMessage = '';
    try {
      const cached = await this.spoonacular.fetchAndCacheRecipe(spoonacularId);
      if (!cached.id) {
        throw new Error('Failed to cache recipe');
      }
      void this.modalCtrl.dismiss({ cachedRecipeId: cached.id });
    } catch {
      this.errorMessage = 'Could not load that recipe. Try again.';
    } finally {
      this.loadingPick = false;
    }
  }
}
