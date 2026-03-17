import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-goal-tracker-habits',
  templateUrl: './goal-tracker-habits.page.html',
  styleUrls: ['./goal-tracker-habits.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent],
})
export class GoalTrackerHabitsPage {}
