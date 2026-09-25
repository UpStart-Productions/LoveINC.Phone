import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-meal-planner-tabs',
  templateUrl: './meal-planner-tabs.page.html',
  styleUrls: ['./meal-planner-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
    RouterLink,
  ],
})
export class MealPlannerTabsPage {}
