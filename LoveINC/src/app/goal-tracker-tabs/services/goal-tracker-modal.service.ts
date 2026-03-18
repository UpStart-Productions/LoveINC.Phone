import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import type { Goal, Habit } from '@upstart-productions/goal-tracker';
import { AddGoalHabitModalComponent } from '../components/add-goal-habit-modal/add-goal-habit-modal.component';
import { GoalTrackerEditService } from './goal-tracker-edit.service';
import { GoalTrackerRefreshService } from './goal-tracker-refresh.service';
import { GoalTrackerDebugService } from './goal-tracker-debug.service';

@Injectable({ providedIn: 'root' })
export class GoalTrackerModalService {
  constructor(
    private modalCtrl: ModalController,
    private editService: GoalTrackerEditService,
    private refreshService: GoalTrackerRefreshService,
    private debug: GoalTrackerDebugService
  ) {}

  async openAdd() {
    this.editService.clear();
    const modal = await this.modalCtrl.create({
      component: AddGoalHabitModalComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.saved) {
      this.refreshService.requestRefresh();
    }
  }

  async openEditHabit(habit: Habit) {
    this.debug.trace(`3. modalService openEditHabit() id=${habit?.id}`);
    this.editService.setEditHabit(habit);
    this.editService.setEditGoal(null);
    const modal = await this.modalCtrl.create({
      component: AddGoalHabitModalComponent,
      componentProps: { edit: true },
    });
    this.debug.trace(`4. modal.present() called`);
    await modal.present();
    this.debug.trace(`5. modal presented`);
    const { data } = await modal.onWillDismiss();
    this.editService.clear();
    if (data?.saved) {
      this.refreshService.requestRefresh();
    }
  }

  async openEditGoal(goal: Goal) {
    this.editService.setEditGoal(goal);
    this.editService.setEditHabit(null);
    const modal = await this.modalCtrl.create({
      component: AddGoalHabitModalComponent,
      componentProps: { edit: true, editGoal: true },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    this.editService.clear();
    if (data?.saved) {
      this.refreshService.requestRefresh();
    }
  }
}
