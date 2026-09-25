import { Component } from '@angular/core';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  IonIcon,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { GoalTrackerModalService } from './services/goal-tracker-modal.service';
import { GoalTrackerKeyboardService } from './services/goal-tracker-keyboard.service';

@Component({
  selector: 'app-goal-tracker-tabs',
  templateUrl: './goal-tracker-tabs.page.html',
  styleUrls: ['./goal-tracker-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    RouterLink,
  ],
})
export class GoalTrackerTabsPage implements ViewWillEnter, ViewWillLeave {
  constructor(
    private modalService: GoalTrackerModalService,
    private keyboardService: GoalTrackerKeyboardService
  ) {}

  ionViewWillEnter() {
    void this.keyboardService.enter();
  }

  ionViewWillLeave() {
    void this.keyboardService.leave();
  }

  onFabClick() {
    this.modalService.openAdd();
  }
}
