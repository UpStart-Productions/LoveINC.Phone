import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { GoalService, HabitService } from '@upstart-productions/goal-tracker';
import type { Habit } from '@upstart-productions/goal-tracker';
import { WeeklyBarChartComponent, WeeklyBarData } from './components/weekly-bar-chart/weekly-bar-chart.component';
import { joinWithAppDot } from '../shared/utils';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
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

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  return `${day} ${month}`;
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

@Component({
  selector: 'app-goal-tracker-statistics',
  templateUrl: './goal-tracker-statistics.page.html',
  styleUrls: ['./goal-tracker-statistics.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    WeeklyBarChartComponent,
  ],
})
export class GoalTrackerStatisticsPage {
  weeklyData: WeeklyBarData[] = [];
  totalCompleted = 0;
  totalScheduled = 0;
  totalPercent = 0;
  weekLabel = '';
  weekDateRangeLabel = '';
  habitStats: HabitStat[] = [];
  loading = true;

  /** Sunday of the currently displayed week */
  selectedWeekStart: Date = getWeekStart(new Date());

  constructor(
    private habitService: HabitService,
    private goalService: GoalService
  ) {}

  ionViewDidEnter() {
    this.loadStats();
  }

  prevWeek() {
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() - 7);
    this.selectedWeekStart = d;
    this.loadStats();
  }

  nextWeek() {
    const d = new Date(this.selectedWeekStart);
    d.setDate(d.getDate() + 7);
    this.selectedWeekStart = d;
    this.loadStats();
  }

  async loadStats() {
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
      this.weekDateRangeLabel = joinWithAppDot(formatShortDate(startDate), formatShortDate(endDate));

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

  getChangeClass(change: number | null): 'success' | 'danger' | 'neutral' {
    if (change === null) return 'neutral';
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'neutral';
  }

  getPercentClass(percent: number): string {
    return percent >= 70 ? 'success' : '';
  }
}
