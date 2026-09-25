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
  selector: 'app-simple-budget-tabs',
  templateUrl: './simple-budget-tabs.page.html',
  styleUrls: ['./simple-budget-tabs.page.scss'],
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
export class SimpleBudgetTabsPage {}
