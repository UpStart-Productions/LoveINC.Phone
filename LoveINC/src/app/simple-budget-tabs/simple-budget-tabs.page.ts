import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
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
    IonButtons,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
    RouterLink,
    AppBackButtonComponent,
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
      url.includes('/tabs/simple-budget/weekly') || url === '/tabs/simple-budget';
    if (url.includes('/tabs/simple-budget/review')) this.headerTitle = 'Weekly Review';
    else if (url.includes('/tabs/simple-budget/reports')) this.headerTitle = 'Reports';
    else if (url.includes('/tabs/simple-budget/export')) this.headerTitle = 'Export';
    else this.headerTitle = 'Simple Budget';
  }
}
