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
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AddGoalHabitModalComponent } from './components/add-goal-habit-modal/add-goal-habit-modal.component';
import { DateScrollerComponent, DateScrollerDate } from './components/date-scroller/date-scroller.component';
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
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    DateScrollerComponent,
  ],
})
export class GoalTrackerTabsPage implements OnInit, OnDestroy {
  isGoalsTab = true;
  completedDates: string[] = [];
  private sub?: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private dateService: GoalTrackerDateService,
    private refreshService: GoalTrackerRefreshService
  ) {}

  ngOnInit() {
    this.updateGoalsTab();
    this.completedDates = this.dateService.completedDates;
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.updateGoalsTab());
    this.sub.add(
      this.dateService.completedDates$.subscribe((d) => (this.completedDates = d))
    );
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private updateGoalsTab() {
    const url = this.router.url;
    this.isGoalsTab =
      url.includes('/goal-tracker/goals') || url === '/tabs/goal-tracker';
  }

  onDateSelected(date: DateScrollerDate) {
    this.dateService.selectedDate = date.date;
  }

  async onFabClick() {
    const modal = await this.modalCtrl.create({
      component: AddGoalHabitModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      this.refreshService.requestRefresh();
    }
  }
}
