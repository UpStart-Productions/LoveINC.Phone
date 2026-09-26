import { Component, OnDestroy, OnInit } from '@angular/core';
import type { ViewWillEnter } from '@ionic/angular';
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
  ModalController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import {
  MealPlannerPlanService,
  compareGroceryAisles,
  formatWeekLabel,
  getCurrentWeekStart,
  type GroceryItem,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
import { GroceryAddItemSheetComponent } from './components/grocery-add-item-sheet/grocery-add-item-sheet.component';
import { GroceryItemListComponent } from './components/grocery-item-list/grocery-item-list.component';
import { MealPlannerStateService } from './services/meal-planner-state.service';
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
export class MealPlannerGroceryPage implements OnInit, OnDestroy, ViewWillEnter {
  loading = true;
  selectedWeekStart = getCurrentWeekStart();
  earliestWeekStart = '';
  weekLabel = '';
  groupedItems: Array<{ aisle: string; items: GroceryItem[] }> = [];
  private weekSub?: Subscription;
  private planSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private stateService: MealPlannerStateService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    this.selectedWeekStart = this.stateService.getSelectedWeekStart();
    this.weekSub = this.stateService.watchSelectedWeekStart().subscribe((week) => {
      this.selectedWeekStart = week;
      void this.loadWeek();
    });
    this.planSub = this.stateService.watchWeeklyPlanChanged().subscribe((week) => {
      if (week === this.selectedWeekStart) {
        void this.loadWeek();
      }
    });
  }

  ionViewWillEnter() {
    void this.loadWeek();
  }

  ngOnDestroy() {
    this.weekSub?.unsubscribe();
    this.planSub?.unsubscribe();
  }

  onWeekSelected(weekStartDate: string) {
    this.stateService.setSelectedWeekStart(weekStartDate);
  }

  async addItem() {
    const modal = await this.modalCtrl.create({
      component: GroceryAddItemSheetComponent,
      cssClass: 'grocery-add-item-sheet',
      breakpoints: [0, 0.38],
      initialBreakpoint: 0.38,
      backdropDismiss: true,
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<{ name?: string }>();
    if (role === 'save' && data?.name) {
      await this.submitAddItem(data.name);
    }
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
      const created = await this.planService.addGroceryItem(this.selectedWeekStart, name);
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
    const groupIndex = this.groupedItems.findIndex((row) => row.aisle === item.aisle);
    if (groupIndex === -1) {
      this.groupedItems = [...this.groupedItems, { aisle: item.aisle, items: [item] }].sort(
        (a, b) => compareGroceryAisles(a.aisle, b.aisle)
      );
      return;
    }

    this.groupedItems = this.groupedItems.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }
      return {
        ...group,
        items: [...group.items, item].sort((a, b) =>
          a.ingredientName.localeCompare(b.ingredientName)
        ),
      };
    });
  }

  private async loadWeek() {
    this.loading = true;
    try {
      this.earliestWeekStart = (await this.planService.getEarliestWeekStart()) ?? '';
      this.weekLabel = formatWeekLabel(this.selectedWeekStart);
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
    } finally {
      this.loading = false;
    }
  }
}
