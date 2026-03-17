import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WeeklyBarData {
  /** Date label (e.g. "25 jun") */
  label: string;
  /** Progress 0–100 */
  value: number;
}

@Component({
  selector: 'app-weekly-bar-chart',
  templateUrl: './weekly-bar-chart.component.html',
  styleUrls: ['./weekly-bar-chart.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class WeeklyBarChartComponent {
  /** Array of 7 items, one per day */
  @Input() data: WeeklyBarData[] = [];
}
