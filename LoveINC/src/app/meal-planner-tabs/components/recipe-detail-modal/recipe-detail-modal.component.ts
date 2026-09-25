import { Component, Input, OnInit } from '@angular/core';
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
import type { CachedRecipe } from '@upstart-productions/meal-planner';
import { MealPlannerRecipeService } from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-recipe-detail-modal',
  templateUrl: './recipe-detail-modal.component.html',
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
  ],
})
export class RecipeDetailModalComponent implements OnInit {
  @Input() recipe!: CachedRecipe;
  @Input() planMealId?: number;
  @Input() extraGuests = 0;

  isFavorite = false;

  constructor(
    private modalCtrl: ModalController,
    private recipeService: MealPlannerRecipeService
  ) {}

  async ngOnInit() {
    if (this.recipe.id) {
      this.isFavorite = await this.recipeService.isFavorite(this.recipe.id);
    }
  }

  dismiss() {
    void this.modalCtrl.dismiss();
  }

  async toggleFavorite() {
    if (!this.recipe.id) {
      return;
    }
    this.isFavorite = !this.isFavorite;
    await this.recipeService.setFavorite(this.recipe.id, this.isFavorite);
  }
}
