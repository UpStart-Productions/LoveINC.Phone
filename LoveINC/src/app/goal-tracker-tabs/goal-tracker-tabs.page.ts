import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { GoalTrackerModalService } from './services/goal-tracker-modal.service';
import { GoalTrackerDateService } from './services/goal-tracker-date.service';
import { GoalTrackerRefreshService } from './services/goal-tracker-refresh.service';

@Component({
  selector: 'app-goal-tracker-tabs',
  templateUrl: './goal-tracker-tabs.page.html',
  styleUrls: ['./goal-tracker-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
  ],
})
export class GoalTrackerTabsPage implements OnInit, OnDestroy {
  isGoalsTab = true;
  private sub?: Subscription;

  constructor(
    private modalService: GoalTrackerModalService,
    private router: Router,
    private dateService: GoalTrackerDateService,
    private refreshService: GoalTrackerRefreshService
  ) {}

  ngOnInit() {
    this.updateGoalsTab();
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.updateGoalsTab());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private updateGoalsTab() {
    const url = this.router.url;
    this.isGoalsTab =
      url.includes('/goal-tracker/goals') || url === '/tabs/goal-tracker';
  }

  get isStatisticsTab(): boolean {
    return !this.isGoalsTab;
  }

  onFabClick() {
    this.modalService.openAdd();
  }
}
