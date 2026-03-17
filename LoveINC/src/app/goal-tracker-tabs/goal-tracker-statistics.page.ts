import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-goal-tracker-statistics',
  templateUrl: './goal-tracker-statistics.page.html',
  styleUrls: ['./goal-tracker-statistics.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class GoalTrackerStatisticsPage {}
