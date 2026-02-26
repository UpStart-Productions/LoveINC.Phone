import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonProgressBar,
  IonCheckbox,
  IonIcon,
  IonButton,
  IonFab,
  IonFabButton,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { GoalService } from './services/goal.service';
import { Goal } from './types/goal.types';

@Component({
  selector: 'app-goal-tracker',
  templateUrl: './goal-tracker.page.html',
  styleUrls: ['./goal-tracker.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonProgressBar,
    IonCheckbox,
    IonIcon,
    IonButton,
    IonFab,
    IonFabButton,
    IonSpinner,
  ],
})
export class GoalTrackerPage implements OnInit {
  goals: Goal[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private goalService: GoalService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.loadGoals();
  }

  async loadGoals() {
    this.loading = true;
    this.error = null;
    try {
      this.goals = await this.goalService.getAllGoals();
    } catch (e) {
      this.error = (e as Error)?.message ?? 'Failed to load goals';
      this.goals = [];
    } finally {
      this.loading = false;
    }
  }

  async addGoal() {
    const alert = await this.alertController.create({
      header: 'New Goal',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Goal title',
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Description (optional)',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Add',
          handler: async (data) => {
            if (data?.title?.trim()) {
              await this.goalService.createGoal({
                title: data.title.trim(),
                description: data.description?.trim() || undefined,
                progress: 0,
                completed: false,
              });
              await this.loadGoals();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async toggleComplete(goal: Goal) {
    if (goal.id == null) return;
    await this.goalService.updateGoal(goal.id, {
      completed: !goal.completed,
      progress: goal.completed ? goal.progress : 100,
    });
    await this.loadGoals();
  }

  async updateProgress(goal: Goal, progress: number) {
    if (goal.id == null) return;
    await this.goalService.updateGoal(goal.id, {
      progress,
      completed: progress >= 100,
    });
    await this.loadGoals();
  }

  async deleteGoal(goal: Goal) {
    if (goal.id == null) return;
    const alert = await this.alertController.create({
      header: 'Delete Goal',
      message: `Delete "${goal.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.goalService.deleteGoal(goal.id!);
            await this.loadGoals();
          },
        },
      ],
    });
    await alert.present();
  }

  get completedCount(): number {
    return this.goals.filter((g) => g.completed).length;
  }
}
