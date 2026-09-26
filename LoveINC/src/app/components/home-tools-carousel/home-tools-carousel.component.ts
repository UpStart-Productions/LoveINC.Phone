import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { SimpleBudgetHomeWidgetComponent } from '../simple-budget-home-widget/simple-budget-home-widget.component';
import { GoalTrackerHomeWidgetComponent } from '../goal-tracker-home-widget/goal-tracker-home-widget.component';
import { JobSearchHomeWidgetComponent } from '../job-search-home-widget/job-search-home-widget.component';
import { JournalHomeWidgetComponent } from '../journal-home-widget/journal-home-widget.component';
import { MealPlannerHomeWidgetComponent } from '../meal-planner-home-widget/meal-planner-home-widget.component';
import { HomeClassToolsPreferenceService } from '../../services/home-class-tools-preference.service';

@Component({
  selector: 'app-home-tools-carousel',
  templateUrl: './home-tools-carousel.component.html',
  styleUrls: ['./home-tools-carousel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    SimpleBudgetHomeWidgetComponent,
    GoalTrackerHomeWidgetComponent,
    JobSearchHomeWidgetComponent,
    JournalHomeWidgetComponent,
    MealPlannerHomeWidgetComponent,
  ],
  host: {
    '[class.home-tools-carousel--empty]': '!hasTools',
    '[class.home-tools-carousel--multiple]': 'multiple',
  },
})
export class HomeToolsCarouselComponent implements OnInit, OnDestroy {
  /** Match Home microlearning carousel section title inset. */
  readonly sectionTitleInset = 'calc(var(--app-card-margin) + 1rem)';

  prefVisible = true;
  private prefSub?: Subscription;

  @ViewChild(SimpleBudgetHomeWidgetComponent)
  private budgetWidget?: SimpleBudgetHomeWidgetComponent;

  @ViewChild(GoalTrackerHomeWidgetComponent)
  private goalsWidget?: GoalTrackerHomeWidgetComponent;

  @ViewChild(JobSearchHomeWidgetComponent)
  private jobSearchWidget?: JobSearchHomeWidgetComponent;

  @ViewChild(JournalHomeWidgetComponent)
  private journalWidget?: JournalHomeWidgetComponent;

  @ViewChild(MealPlannerHomeWidgetComponent)
  private mealPlannerWidget?: MealPlannerHomeWidgetComponent;

  budgetVisible = false;
  goalsVisible = false;
  jobSearchVisible = false;
  journalVisible = false;
  mealPlannerVisible = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly homeClassTools: HomeClassToolsPreferenceService
  ) {}

  ngOnInit(): void {
    this.prefVisible = this.homeClassTools.isVisible();
    this.prefSub = this.homeClassTools.visibility$.subscribe((visible) => {
      this.prefVisible = visible;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.prefSub?.unsubscribe();
  }

  get hasTools(): boolean {
    return this.prefVisible && this.visibleCount > 0;
  }

  get multiple(): boolean {
    return this.visibleCount > 1;
  }

  get visibleCount(): number {
    return (
      Number(this.budgetVisible) +
      Number(this.goalsVisible) +
      Number(this.jobSearchVisible) +
      Number(this.journalVisible) +
      Number(this.mealPlannerVisible)
    );
  }

  get peekCssValue(): string {
    return this.multiple ? '30%' : '0%';
  }

  onBudgetVisible(visible: boolean): void {
    if (this.budgetVisible === visible) return;
    this.budgetVisible = visible;
    this.cdr.markForCheck();
  }

  onGoalsVisible(visible: boolean): void {
    if (this.goalsVisible === visible) return;
    this.goalsVisible = visible;
    this.cdr.markForCheck();
  }

  onJobSearchVisible(visible: boolean): void {
    if (this.jobSearchVisible === visible) return;
    this.jobSearchVisible = visible;
    this.cdr.markForCheck();
  }

  onJournalVisible(visible: boolean): void {
    if (this.journalVisible === visible) return;
    this.journalVisible = visible;
    this.cdr.markForCheck();
  }

  onMealPlannerVisible(visible: boolean): void {
    if (this.mealPlannerVisible === visible) return;
    this.mealPlannerVisible = visible;
    this.cdr.markForCheck();
  }

  refresh(): void {
    this.budgetWidget?.refresh();
    this.goalsWidget?.refresh();
    this.jobSearchWidget?.refresh();
    this.journalWidget?.refresh();
    this.mealPlannerWidget?.refresh();
  }
}
