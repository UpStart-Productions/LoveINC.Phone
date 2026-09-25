import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Habit } from '@upstart-productions/goal-tracker';
import { WeeklyBarChartComponent, WeeklyBarData } from './components/weekly-bar-chart/weekly-bar-chart.component';
import { PdfService } from '../services/pdf.service';
import { UserProfileService } from '../services/user-profile.service';
import { OnboardingService } from '../services/onboarding.service';
import {
  buildGoalTrackerStatisticsDocDefinition,
  buildGoalTrackerStatisticsPdfFilename,
} from './utils/goal-tracker-statistics-pdf.util';

const MONTHS_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface HabitStat {
  habit: Habit;
  goalName: string;
  completed: number;
  scheduled: number;
  percent: number;
  /** Change vs previous week (points, e.g. 15 = +15%) */
  change: number | null;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Format for bar chart labels: "3/15" (month/day) */
function formatBarLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Format for week label: "Week Mar 15 - Mar 21" */
function formatWeekLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const startMonth = MONTHS_LABEL[start.getMonth()];
  const endMonth = MONTHS_LABEL[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  return `Week ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/** Get Sunday 00:00 of the week containing the given date (US week: Sun–Sat) */
function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Get array of 7 date strings (YYYY-MM-DD) for the week starting at weekStart */
function getWeekDates(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(toDateStr(d));
  }
  return dates;
}

interface MonthRange {
  label: string;
  startDate: string;
  endDate: string;
}

/** Rolling 12 calendar months ending at the reference month (inclusive). */
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
  if (!ranges.length) return '';
  return `${formatMonthYearShort(ranges[0].startDate)} – ${formatMonthYearShort(ranges[ranges.length - 1].startDate)}`;
}

function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  while (cursor <= end) {
    dates.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

@Component({
  selector: 'app-goal-tracker-statistics',
  templateUrl: './goal-tracker-statistics.page.html',
  styleUrls: ['./goal-tracker-statistics.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonButton,
    IonIcon,
    AppBackButtonComponent,
    WeeklyBarChartComponent,
  ],
})
export class GoalTrackerStatisticsPage {
  weeklyData: WeeklyBarData[] = [];
  totalCompleted = 0;
  totalScheduled = 0;
  totalPercent = 0;
  weekLabel = '';
  yearRangeLabel = '';
  chartView: 'week' | 'year' = 'week';
  habitStats: HabitStat[] = [];
  loading = true;
  exporting = false;
  sharing = false;

  /** Sunday of the currently displayed week */
  selectedWeekStart: Date = getWeekStart(new Date());

  constructor(
    private habitService: HabitService,
    private goalService: GoalService,
    private pdfService: PdfService,
    private userProfile: UserProfileService,
    private onboarding: OnboardingService,
    private alertController: AlertController,
    private ngZone: NgZone
  ) {}

  ionViewDidEnter() {
    this.loadStats();
  }

  prevWeek() {
    if (this.chartView !== 'week') return;
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() - 7);
    this.selectedWeekStart = d;
    this.loadStats();
  }

  nextWeek() {
    if (this.chartView !== 'week') return;
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() + 7);
    this.selectedWeekStart = d;
    this.loadStats();
  }

  toggleChartView() {
    this.chartView = this.chartView === 'week' ? 'year' : 'week';
    this.loadStats();
  }

  async loadStats() {
    if (this.chartView === 'year') {
      await this.loadYearStats();
      return;
    }
    await this.loadWeekStats();
  }

  private async loadWeekStats() {
    this.loading = true;
    try {
      const weekDates = getWeekDates(this.selectedWeekStart);
      const startDate = weekDates[0];
      const endDate = weekDates[6];

      // Previous week for change calculation
      const prevWeekStart = new Date(this.selectedWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekDates = getWeekDates(prevWeekStart);
      const prevStart = prevWeekDates[0];
      const prevEnd = prevWeekDates[6];

      const [habits, goals, completions, prevCompletions] = await Promise.all([
        this.habitService.getAllHabits(),
        this.goalService.getAllGoals(),
        this.habitService.getCompletionsInDateRange(startDate, endDate),
        this.habitService.getCompletionsInDateRange(prevStart, prevEnd),
      ]);

      const goalMap = new Map<number, string>();
      for (const g of goals) goalMap.set(g.id!, g.title);

      this.weekLabel = formatWeekLabel(startDate, endDate);

      // Weekly bar chart: one bar per day, value = % of scheduled habits completed
      const barData: WeeklyBarData[] = [];
      let totalCompleted = 0;
      let totalScheduled = 0;

      for (let i = 0; i < 7; i++) {
        const dateStr = weekDates[i];
        let scheduled = 0;
        let completed = 0;
        for (const habit of habits) {
          if (this.habitService.isHabitScheduledForDate(habit, dateStr)) {
            scheduled++;
            const set = completions.get(habit.id!);
            if (set?.has(dateStr)) completed++;
          }
        }
        totalScheduled += scheduled;
        totalCompleted += completed;
        const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
        barData.push({ label: formatBarLabel(dateStr), value: pct, completed, scheduled });
      }

      this.weeklyData = barData;
      this.totalCompleted = totalCompleted;
      this.totalScheduled = totalScheduled;
      this.totalPercent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

      // Habit stats: completed/scheduled per habit, change vs prev week, sorted by % best first
      const stats: HabitStat[] = [];
      for (const habit of habits) {
        let scheduled = 0;
        let completed = 0;
        let prevScheduled = 0;
        let prevCompleted = 0;
        for (let i = 0; i < 7; i++) {
          if (this.habitService.isHabitScheduledForDate(habit, weekDates[i])) {
            scheduled++;
            if (completions.get(habit.id!)?.has(weekDates[i])) completed++;
          }
          if (this.habitService.isHabitScheduledForDate(habit, prevWeekDates[i])) {
            prevScheduled++;
            if (prevCompletions.get(habit.id!)?.has(prevWeekDates[i])) prevCompleted++;
          }
        }
        const percent = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
        let change: number | null = null;
        if (prevScheduled > 0) {
          const prevPercent = Math.round((prevCompleted / prevScheduled) * 100);
          change = percent - prevPercent;
        }
        const goalName = goalMap.get(habit.goalId) ?? '';
        stats.push({ habit, goalName, completed, scheduled, percent, change });
      }
      stats.sort((a, b) => b.percent - a.percent);
      this.habitStats = stats;
    } catch (err) {
      console.warn('Statistics load error:', err);
    } finally {
      this.loading = false;
    }
  }

  private async loadYearStats() {
    this.loading = true;
    try {
      const today = new Date();
      const monthRanges = getLast12MonthRanges(today);
      const priorReference = new Date(today.getFullYear(), today.getMonth() - 12 + 1, 0);
      const priorRanges = getLast12MonthRanges(priorReference);

      const rangeStart = monthRanges[0].startDate;
      const rangeEnd = monthRanges[monthRanges.length - 1].endDate;
      const priorStart = priorRanges[0].startDate;
      const priorEnd = priorRanges[priorRanges.length - 1].endDate;

      const [habits, goals, completions, priorCompletions] = await Promise.all([
        this.habitService.getAllHabits(),
        this.goalService.getAllGoals(),
        this.habitService.getCompletionsInDateRange(rangeStart, rangeEnd),
        this.habitService.getCompletionsInDateRange(priorStart, priorEnd),
      ]);

      const goalMap = new Map<number, string>();
      for (const g of goals) goalMap.set(g.id!, g.title);

      this.yearRangeLabel = formatYearRangeLabel(monthRanges);
      this.weekLabel = this.yearRangeLabel;

      const barData: WeeklyBarData[] = [];
      let totalCompleted = 0;
      let totalScheduled = 0;

      for (const month of monthRanges) {
        const dates = getDatesBetween(month.startDate, month.endDate);
        let scheduled = 0;
        let completed = 0;
        for (const dateStr of dates) {
          for (const habit of habits) {
            if (this.habitService.isHabitScheduledForDate(habit, dateStr)) {
              scheduled++;
              if (completions.get(habit.id!)?.has(dateStr)) completed++;
            }
          }
        }
        totalScheduled += scheduled;
        totalCompleted += completed;
        const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
        barData.push({ label: month.label, value: pct, completed, scheduled });
      }

      this.weeklyData = barData;
      this.totalCompleted = totalCompleted;
      this.totalScheduled = totalScheduled;
      this.totalPercent = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

      const stats: HabitStat[] = [];
      for (const habit of habits) {
        let scheduled = 0;
        let completed = 0;
        let prevScheduled = 0;
        let prevCompleted = 0;

        for (const month of monthRanges) {
          for (const dateStr of getDatesBetween(month.startDate, month.endDate)) {
            if (this.habitService.isHabitScheduledForDate(habit, dateStr)) {
              scheduled++;
              if (completions.get(habit.id!)?.has(dateStr)) completed++;
            }
          }
        }

        for (const month of priorRanges) {
          for (const dateStr of getDatesBetween(month.startDate, month.endDate)) {
            if (this.habitService.isHabitScheduledForDate(habit, dateStr)) {
              prevScheduled++;
              if (priorCompletions.get(habit.id!)?.has(dateStr)) prevCompleted++;
            }
          }
        }

        const percent = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
        let change: number | null = null;
        if (prevScheduled > 0) {
          const prevPercent = Math.round((prevCompleted / prevScheduled) * 100);
          change = percent - prevPercent;
        }
        const goalName = goalMap.get(habit.goalId) ?? '';
        stats.push({ habit, goalName, completed, scheduled, percent, change });
      }
      stats.sort((a, b) => b.percent - a.percent);
      this.habitStats = stats;
    } catch (err) {
      console.warn('Statistics year load error:', err);
    } finally {
      this.loading = false;
    }
  }

  getChangeClass(change: number | null): 'success' | 'danger' | 'neutral' {
    if (change === null) return 'neutral';
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'neutral';
  }

  getPercentClass(percent: number): string {
    return percent >= 70 ? 'success' : '';
  }

  get habitsCompletedLabel(): string {
    return `${this.totalCompleted}/${this.totalScheduled} habits completed`;
  }

  get periodLabel(): string {
    return this.chartView === 'year' ? this.yearRangeLabel : this.weekLabel;
  }

  getUserFullName(): string | null {
    const profile = this.userProfile.getProfile();
    if (profile.firstName?.trim() && profile.lastName?.trim()) {
      return `${profile.firstName.trim()} ${profile.lastName.trim()}`;
    }
    return this.onboarding.getUserFullName();
  }

  async exportPdf() {
    if (this.loading || this.exporting || this.sharing) return;
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

  async shareStats() {
    if (this.loading || this.exporting || this.sharing) return;
    this.sharing = true;
    try {
      const filePath = await this.createAndSavePdf();
      this.pdfService.setShareMetadata('Goal Tracker Statistics', this.periodLabel);
      await this.pdfService.sharePdf(filePath);
    } catch (err) {
      if (!this.isShareCancelled(err)) {
        await this.presentAlert('Share failed', this.getErrorMessage(err));
      }
    } finally {
      this.resetActionState('sharing');
    }
  }

  private async createAndSavePdf(): Promise<string> {
    const docDefinition = buildGoalTrackerStatisticsDocDefinition({
      weekLabel: this.periodLabel,
      totalPercent: this.totalPercent,
      totalCompleted: this.totalCompleted,
      totalScheduled: this.totalScheduled,
      weeklyData: this.weeklyData,
      habitStats: this.habitStats,
      userFullName: this.getUserFullName() ?? undefined,
    });
    const filename = buildGoalTrackerStatisticsPdfFilename(this.periodLabel);
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

  private isShareCancelled(err: unknown): boolean {
    const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    return message.includes('cancel') || message.includes('dismiss');
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
