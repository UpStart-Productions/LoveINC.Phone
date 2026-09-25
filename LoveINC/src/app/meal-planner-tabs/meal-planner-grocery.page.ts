import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonListHeader,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import {
  MealPlannerPlanService,
  formatWeekLabel,
  getCurrentWeekStart,
  type GroceryItem,
} from '@upstart-productions/meal-planner';
import { MealWeekScrollerComponent } from './components/week-scroller/week-scroller.component';
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
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonListHeader,
    AppBackButtonComponent,
    MealWeekScrollerComponent,
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
    private stateService: MealPlannerStateService
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

  onWeekSelected(weekStartDate: string) {
    this.stateService.setSelectedWeekStart(weekStartDate);
  }

  async toggleItem(item: GroceryItem, checked: boolean) {
    if (!item.id) {
      return;
    }
    item.isChecked = checked;
    await this.planService.setGroceryItemChecked(item.id, checked);
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
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([aisle, aisleItems]) => ({ aisle, items: aisleItems }));
    } finally {
      this.loading = false;
    }
  }
}
