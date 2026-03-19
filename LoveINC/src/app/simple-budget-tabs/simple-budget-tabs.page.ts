import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-simple-budget-tabs',
  templateUrl: './simple-budget-tabs.page.html',
  styleUrls: ['./simple-budget-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBackButton,
    IonButtons,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
  ],
})
export class SimpleBudgetTabsPage implements OnInit, OnDestroy {
  isWeeklyTab = true;
  headerTitle = 'Simple Budget';
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateTabState();
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.updateTabState());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private updateTabState() {
    const url = this.router.url;
    this.isWeeklyTab =
      url.includes('/simple-budget/weekly') || url === '/tabs/simple-budget';
    if (url.includes('/simple-budget/quick-adjust')) this.headerTitle = 'Quick Adjust';
    else if (url.includes('/simple-budget/review')) this.headerTitle = 'Weekly Review';
    else if (url.includes('/simple-budget/reports')) this.headerTitle = 'Reports';
    else if (url.includes('/simple-budget/export')) this.headerTitle = 'Export';
    else this.headerTitle = 'Simple Budget';
  }
}
