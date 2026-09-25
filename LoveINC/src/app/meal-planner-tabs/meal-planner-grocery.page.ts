import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import {
  MealPlannerPlanService,
  compareGroceryAisles,
  formatWeekLabel,
  getCurrentWeekStart,
  resolveIngredientImageUrl,
  type GroceryItem,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { GroceryItemListComponent } from './components/grocery-item-list/grocery-item-list.component';
import { MealPlannerStateService } from './services/meal-planner-state.service';
import { SpoonacularService } from './services/spoonacular.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-meal-planner-grocery',
  templateUrl: './meal-planner-grocery.page.html',
  styleUrls: ['./meal-planner-grocery.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    AppBackButtonComponent,
    MealWeekScrollerComponent,
    GroceryItemListComponent,
  ],
})
export class MealPlannerGroceryPage implements OnInit, OnDestroy {
  loading = true;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  weekLabel = '';
  groupedItems: Array<{ aisle: string; items: GroceryItem[] }> = [];
  private weekSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private stateService: MealPlannerStateService,
    private spoonacularService: SpoonacularService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.selectedWeekStart = this.stateService.getSelectedWeekStart();
    this.weekSub = this.stateService.watchSelectedWeekStart().subscribe((week) => {
      this.selectedWeekStart = week;
      void this.loadWeek();
    });
  }

  ngOnDestroy() {
    this.weekSub?.unsubscribe();
  }

  onWeekSelected(weekStartDate: string) {
    this.stateService.setSelectedWeekStart(weekStartDate);
  }

  async addItem() {
    const alert = await this.alertCtrl.create({
      header: 'Add item',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Item name',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: (values) => {
            void this.submitAddItem(values?.['name']);
          },
        },
      ],
    });
    await alert.present();
  }

  async onGroceryRowTap(item: GroceryItem) {
    const itemId = item.id;
    if (!itemId) {
      return;
    }
    const checked = !item.isChecked;
    item.isChecked = checked;
    await this.planService.setGroceryItemChecked(itemId, checked);
  }

  async onGroceryRowDelete(item: GroceryItem) {
    const itemId = item.id;
    if (!itemId) {
      return;
    }
    await this.planService.removeGroceryItem(itemId);
    this.groupedItems = this.groupedItems
      .map((group) => ({
        ...group,
        items: group.items.filter((row) => row.id !== itemId),
      }))
      .filter((group) => group.items.length > 0);
  }

  private async submitAddItem(rawName: unknown) {
    const name = String(rawName ?? '').trim();
    if (!name) {
      return;
    }

    try {
      const imageUrl = await this.spoonacularService.fetchIngredientImage(name);
      const created = await this.planService.addGroceryItem(
        this.selectedWeekStart,
        name,
        imageUrl
      );
      this.insertGroceryItem(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add that item.';
      const alert = await this.alertCtrl.create({
        header: 'Add item',
        message,
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  private insertGroceryItem(item: GroceryItem) {
    let group = this.groupedItems.find((row) => row.aisle === item.aisle);
    if (!group) {
      group = { aisle: item.aisle, items: [] };
      this.groupedItems = [...this.groupedItems, group].sort((a, b) =>
        compareGroceryAisles(a.aisle, b.aisle)
      );
      group = this.groupedItems.find((row) => row.aisle === item.aisle)!;
    }
    group.items = [...group.items, item].sort((a, b) =>
      a.ingredientName.localeCompare(b.ingredientName)
    );
  }

  private async loadWeek() {
    this.loading = true;
    try {
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
      await this.backfillRecipeIngredientImages();
      const items = await this.planService.getGroceryItems(this.selectedWeekStart);
      const map = new Map<string, GroceryItem[]>();
      for (const item of items) {
        const list = map.get(item.aisle) ?? [];
        list.push(item);
        map.set(item.aisle, list);
      }
      this.groupedItems = [...map.entries()]
        .sort(([a], [b]) => compareGroceryAisles(a, b))
        .map(([aisle, aisleItems]) => ({
          aisle,
          items: aisleItems,
        }));
      await this.applyImagesFromRecipes();
    } finally {
      this.loading = false;
    }
  }

  private async backfillRecipeIngredientImages() {
    try {
      const plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
      if (!plan?.meals.length) {
        return;
      }

      const refreshedRecipeIds = new Set<number>();
      for (const meal of plan.meals) {
        const recipe = meal.recipe;
        if (!recipe?.id || refreshedRecipeIds.has(recipe.id)) {
          continue;
        }
        if (recipe.ingredients.every((ingredient) => ingredient.imageFile?.trim())) {
          refreshedRecipeIds.add(recipe.id);
          continue;
        }
        refreshedRecipeIds.add(recipe.id);
        try {
          await this.spoonacularService.refreshCachedRecipeIngredientImages(recipe);
        } catch {
          // Stop backfill on quota errors so recipe search keeps working.
          break;
        }
      }
    } catch {
      // Ingredient photos are optional — never block the grocery list.
    }
  }

  private async applyImagesFromRecipes() {
    const plan = await this.planService.getWeeklyPlan(this.selectedWeekStart);
    if (!plan?.meals.length) {
      return;
    }

    const imageByName = new Map<string, string>();
    for (const meal of plan.meals) {
      const recipe = meal.recipe;
      if (!recipe) {
        continue;
      }
      for (const ingredient of recipe.ingredients) {
        const imageUrl = resolveIngredientImageUrl(ingredient);
        if (!imageUrl) {
          continue;
        }
        imageByName.set(this.normalizeIngredientLookupKey(ingredient.name), imageUrl);
      }
    }

    for (const [nameKey, imageUrl] of imageByName.entries()) {
      await this.applyIngredientImage(nameKey, imageUrl);
    }
  }

  private normalizeIngredientLookupKey(name: string): string {
    return name.trim().toLowerCase();
  }

  private async applyIngredientImage(nameKey: string, imageUrl: string) {
    for (const group of this.groupedItems) {
      for (const row of group.items) {
        if (row.ingredientName.toLowerCase() !== nameKey || !row.id) {
          continue;
        }
        row.imageUrl = imageUrl;
        await this.planService.setGroceryItemImageUrl(row.id, imageUrl);
      }
    }
  }
}
