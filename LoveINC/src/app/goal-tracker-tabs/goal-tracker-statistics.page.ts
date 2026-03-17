import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { WeeklyBarChartComponent, WeeklyBarData } from './components/weekly-bar-chart/weekly-bar-chart.component';

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
  /** Mock data for weekly bar chart */
  weeklyData: WeeklyBarData[] = [
    { label: '25 jun', value: 40 },
    { label: '26 jun', value: 70 },
    { label: '27 jun', value: 60 },
    { label: '28 jun', value: 80 },
    { label: '29 jun', value: 70 },
    { label: '30 jun', value: 30 },
    { label: '31 jun', value: 65 },
  ];
}
