import { Component, NgZone, OnDestroy } from '@angular/core';
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
import { ContentCardListComponent } from '../components/content-card-list/content-card-list.component';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import {
  MealPlannerPlanService,
  MealPlannerProfileService,
  getCurrentWeekStart,
  type PlanMeal,
  type WeeklyPlan,
} from '@upstart-productions/meal-planner';
import {
  WeeklyBarChartComponent,
  type WeeklyBarData,
} from '../goal-tracker-tabs/components/weekly-bar-chart/weekly-bar-chart.component';
import { PdfService } from '../services/pdf.service';
import { SharingService } from '../services/sharing/sharing.service';
import { UserProfileService } from '../services/user-profile.service';
import { OnboardingService } from '../services/onboarding.service';
import { MealPlannerStateService } from './services/meal-planner-state.service';
import { mapPlanMealToListItem } from './utils/meal-planner-list.mapper';
import { buildMealRecapNarrative } from './utils/meal-planner-summary-narrative.util';
import {
  buildMealPlannerSummaryDocDefinition,
  buildMealPlannerSummaryPdfFilename,
  buildMealPlannerSummaryShareHtml,
  type SummaryPdfCookedMeal,
} from './utils/meal-planner-summary-pdf.util';
import { Subscription } from 'rxjs';

const MONTHS_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ROLLING_WEEKS = 6;

interface MonthRange {
  label: string;
  startDate: string;
  endDate: string;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatBarLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRollingWeekStarts(count: number, endWeekStart: Date = getWeekStart(new Date())): string[] {
  const starts: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const week = new Date(endWeekStart);
    week.setDate(endWeekStart.getDate() - i * 7);
    starts.push(toDateStr(week));
  }
  return starts;
}

function formatWeekRangeLabel(firstWeekStart: string, lastWeekStart: string): string {
  const start = new Date(firstWeekStart + 'T12:00:00');
  const end = new Date(lastWeekStart + 'T12:00:00');
  end.setDate(end.getDate() + 6);
  const startMonth = MONTHS_LABEL[start.getMonth()];
  const endMonth = MONTHS_LABEL[end.getMonth()];
  return `Week ${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

function getLast12MonthRanges(referenceDate: Date = new Date()): MonthRange[] {
  const ranges: MonthRange[] = [];
  const todayStr = toDateStr(referenceDate);

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const startDate = toDateStr(new Date(year, month, 1));
    let endDate = toDateStr(new Date(year, month + 1, 0));

    if (year === referenceDate.getFullYear() && month === referenceDate.getMonth()) {
      endDate = todayStr;
    }

    ranges.push({
      label: MONTHS_LABEL[month],
      startDate,
      endDate,
    });
  }

  return ranges;
}

function formatMonthYearShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${MONTHS_LABEL[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
}

function formatYearRangeLabel(ranges: MonthRange[]): string {
  if (!ranges.length) {
    return '';
  }
  return `${formatMonthYearShort(ranges[0].startDate)} – ${formatMonthYearShort(ranges[ranges.length - 1].startDate)}`;
}

function countMeals(plan: WeeklyPlan | null): { planned: number; cooked: number } {
  const meals = plan?.meals ?? [];
  return {
    planned: meals.length,
    cooked: meals.filter((meal) => meal.isCooked).length,
  };
}

function cookedMealsFromPlan(plan: WeeklyPlan | null): PlanMeal[] {
  return (plan?.meals ?? []).filter((meal) => meal.isCooked);
}

@Component({
  selector: 'app-meal-planner-summary',
  templateUrl: './meal-planner-summary.page.html',
  styleUrls: ['./meal-planner-summary.page.scss'],
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
    WeeklyBarChartComponent,
    ContentCardListComponent,
  ],
})
export class MealPlannerSummaryPage implements OnDestroy {
  weeklyData: WeeklyBarData[] = [];
  totalCompleted = 0;
  totalScheduled = 0;
  totalPercent = 0;
  weekRangeLabel = '';
  yearRangeLabel = '';
  chartView: 'week' | 'year' = 'week';
  cookedListItems: ContentCardListItem[] = [];
  recapNarrative: string | null = null;
  loading = true;
  exporting = false;
  sharing = false;

  /** Last week (Sunday) in the rolling 6-week chart window */
  selectedWeekEnd = getWeekStart(new Date());

  private householdSize = 2;
  private cookedMeals: PlanMeal[] = [];
  private planSub?: Subscription;

  constructor(
    private planService: MealPlannerPlanService,
    private profileService: MealPlannerProfileService,
    private stateService: MealPlannerStateService,
    private pdfService: PdfService,
    private sharingService: SharingService,
    private userProfile: UserProfileService,
    private onboarding: OnboardingService,
    private alertController: AlertController,
    private ngZone: NgZone
  ) {}

  ngOnDestroy() {
    this.planSub?.unsubscribe();
  }

  ionViewDidEnter() {
    this.planSub?.unsubscribe();
    this.planSub = this.stateService.watchWeeklyPlanChanged().subscribe(() => {
      void this.loadStats();
    });
    void this.loadStats();
  }

  toggleChartView() {
    this.chartView = this.chartView === 'week' ? 'year' : 'week';
    void this.loadStats();
  }

  prevWeek() {
    if (this.chartView !== 'week') {
      return;
    }
    const d = new Date(this.selectedWeekEnd);
    d.setDate(d.getDate() - 7);
    this.selectedWeekEnd = d;
    void this.loadStats();
  }

  nextWeek() {
    if (this.chartView !== 'week') {
      return;
    }
    const currentWeekStart = getWeekStart(new Date());
    const d = new Date(this.selectedWeekEnd);
    d.setDate(d.getDate() + 7);
    if (d > currentWeekStart) {
      return;
    }
    this.selectedWeekEnd = d;
    void this.loadStats();
  }

  get mealsCookedLabel(): string {
    return `${this.totalCompleted}/${this.totalScheduled} meals cooked`;
  }

  get periodLabel(): string {
    return this.chartView === 'year' ? this.yearRangeLabel : this.weekRangeLabel;
  }

  async shareStats() {
    if (this.loading || this.exporting || this.sharing) {
      return;
    }
    this.sharing = true;
    try {
      const shareHtml = buildMealPlannerSummaryShareHtml({
        periodLabel: this.displayPeriodLabel,
        totalPercent: this.totalPercent,
        totalCompleted: this.totalCompleted,
        totalScheduled: this.totalScheduled,
        weeklyData: this.weeklyData,
        cookedMeals: this.cookedMealsForExport(),
        recapNarrative: this.recapNarrative ?? undefined,
        userFullName: this.getUserFullName() ?? undefined,
      });

      await this.sharingService.shareContent({
        title: 'Meal Planner Summary',
        subject: `Meal Planner Summary: ${this.displayPeriodLabel}`,
        htmlContent: shareHtml,
        actionSheetHeader: 'Share Summary',
        pdfShare: {
          subject: 'Meal Planner Summary',
          body: this.displayPeriodLabel,
          generate: async () => {
            const filePath = await this.createAndSavePdf();
            return {
              filePath,
              filename: buildMealPlannerSummaryPdfFilename(this.displayPeriodLabel),
            };
          },
        },
      });
    } catch (err) {
      await this.presentAlert('Share failed', this.getErrorMessage(err));
    } finally {
      this.resetActionState('sharing');
    }
  }

  async exportPdf() {
    if (this.loading || this.exporting || this.sharing) {
      return;
    }
    this.exporting = true;
    try {
      const filePath = await this.createAndSavePdf();
      await this.pdfService.openPdfInNativeViewer(filePath);
    } catch (err) {
      await this.presentAlert('Export failed', this.getErrorMessage(err));
    } finally {
      this.resetActionState('exporting');
    }
  }

  private get displayPeriodLabel(): string {
    return this.chartView === 'year' ? this.yearRangeLabel : this.periodLabel;
  }

  private async loadStats() {
    if (this.chartView === 'year') {
      await this.loadYearStats();
      return;
    }
    await this.loadWeekStats();
  }

  private async loadWeekStats() {
    this.loading = true;
    try {
      await this.loadProfileContext();
      const weekStarts = getRollingWeekStarts(ROLLING_WEEKS, this.selectedWeekEnd);
      const plans = await Promise.all(weekStarts.map((weekStart) => this.planService.getWeeklyPlan(weekStart)));

      this.weekRangeLabel = formatWeekRangeLabel(weekStarts[0], weekStarts[weekStarts.length - 1]);

      const barData: WeeklyBarData[] = [];
      let totalCompleted = 0;
      let totalScheduled = 0;
      const cookedMeals: PlanMeal[] = [];

      for (let i = 0; i < weekStarts.length; i++) {
        const plan = plans[i];
        const { planned, cooked } = countMeals(plan);
        totalScheduled += planned;
        totalCompleted += cooked;
        cookedMeals.push(...cookedMealsFromPlan(plan));
        const pct = planned > 0 ? Math.round((cooked / planned) * 100) : 0;
        barData.push({
          label: formatBarLabel(weekStarts[i]),
          value: pct,
          completed: cooked,
          scheduled: planned,
        });
      }

      this.weeklyData = barData;
      this.totalCompleted = totalCompleted;
      this.totalScheduled = totalScheduled;
      this.totalPercent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
      this.applyCookedMeals(cookedMeals, plans.filter((plan): plan is WeeklyPlan => plan != null));
    } catch (err) {
      console.warn('Meal summary load error:', err);
    } finally {
      this.loading = false;
    }
  }

  private async loadYearStats() {
    this.loading = true;
    try {
      await this.loadProfileContext();
      const today = new Date();
      const monthRanges = getLast12MonthRanges(today);
      const earliestWeekStart = toDateStr(getWeekStart(new Date(monthRanges[0].startDate + 'T12:00:00')));
      const latestWeekStart = getCurrentWeekStart();
      const plans = await this.planService.getWeeklyPlansBetweenWeekStarts(earliestWeekStart, latestWeekStart);

      this.yearRangeLabel = formatYearRangeLabel(monthRanges);

      const barData: WeeklyBarData[] = [];
      let totalCompleted = 0;
      let totalScheduled = 0;
      const cookedMeals: PlanMeal[] = [];

      for (const month of monthRanges) {
        let planned = 0;
        let cooked = 0;
        for (const plan of plans) {
          if (plan.weekStartDate >= month.startDate && plan.weekStartDate <= month.endDate) {
            const counts = countMeals(plan);
            planned += counts.planned;
            cooked += counts.cooked;
            cookedMeals.push(...cookedMealsFromPlan(plan));
          }
        }
        totalScheduled += planned;
        totalCompleted += cooked;
        const pct = planned > 0 ? Math.round((cooked / planned) * 100) : 0;
        barData.push({
          label: month.label,
          value: pct,
          completed: cooked,
          scheduled: planned,
        });
      }

      this.weeklyData = barData;
      this.totalCompleted = totalCompleted;
      this.totalScheduled = totalScheduled;
      this.totalPercent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
      this.applyCookedMeals(cookedMeals, plans);
    } catch (err) {
      console.warn('Meal summary year load error:', err);
    } finally {
      this.loading = false;
    }
  }

  private async loadProfileContext() {
    const profile = await this.profileService.getProfile();
    this.householdSize = profile?.householdSize ?? 2;
  }

  private applyCookedMeals(meals: PlanMeal[], plans: WeeklyPlan[]): void {
    const servingDeltaByPlanId = new Map(
      plans.map((plan) => [plan.id, plan.weekServingDelta] as const)
    );

    this.cookedMeals = meals
      .slice()
      .sort((a, b) => String(b.cookedAt ?? '').localeCompare(String(a.cookedAt ?? '')));
    this.recapNarrative = buildMealRecapNarrative(this.cookedMeals);
    this.cookedListItems = this.cookedMeals.map((meal) => ({
      ...mapPlanMealToListItem(
        meal,
        meal.slotIndex,
        this.householdSize,
        servingDeltaByPlanId.get(meal.weeklyPlanId) ?? 0
      ),
      id: String(meal.id),
    }));
  }

  private cookedMealsForExport(): SummaryPdfCookedMeal[] {
    return this.cookedListItems.map((item) => ({
      title: item.title,
      detail: item.detail,
    }));
  }

  private getUserFullName(): string | null {
    const profile = this.userProfile.getProfile();
    if (profile.firstName?.trim() && profile.lastName?.trim()) {
      return `${profile.firstName.trim()} ${profile.lastName.trim()}`;
    }
    return this.onboarding.getUserFullName();
  }

  private async createAndSavePdf(): Promise<string> {
    const docDefinition = buildMealPlannerSummaryDocDefinition({
      periodLabel: this.displayPeriodLabel,
      totalPercent: this.totalPercent,
      totalCompleted: this.totalCompleted,
      totalScheduled: this.totalScheduled,
      weeklyData: this.weeklyData,
      cookedMeals: this.cookedMealsForExport(),
      recapNarrative: this.recapNarrative ?? undefined,
      stackChartAboveContent: this.chartView === 'year',
      userFullName: this.getUserFullName() ?? undefined,
    });
    const filename = buildMealPlannerSummaryPdfFilename(this.displayPeriodLabel);
    const pdfDoc = this.pdfService.createPdfFromDefinition(docDefinition);
    return this.pdfService.savePdfToDevice(pdfDoc, filename);
  }

  private resetActionState(field: 'exporting' | 'sharing') {
    this.ngZone.run(() => {
      this[field] = false;
    });
  }

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }
    return 'Something went wrong while creating the PDF.';
  }

  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
