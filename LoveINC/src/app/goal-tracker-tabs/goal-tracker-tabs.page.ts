import { Component } from '@angular/core';
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
export class GoalTrackerTabsPage {
  constructor(private modalService: GoalTrackerModalService) {}

  onFabClick() {
    this.modalService.openAdd();
  }
}
