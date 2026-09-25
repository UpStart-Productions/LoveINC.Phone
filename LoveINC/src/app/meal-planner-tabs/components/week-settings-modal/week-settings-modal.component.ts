import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  ModalController,
} from '@ionic/angular/standalone';
import type { MealPlannerProfile } from '@upstart-productions/meal-planner';
import { MealPlannerProfileService } from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-week-settings-modal',
  templateUrl: './week-settings-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
  ],
})
export class WeekSettingsModalComponent implements OnInit {
  @Input() weekServingDelta = 0;
  @Input() weekNote = '';

  householdSize = 2;
  maxReadyMinutes = 45;

  constructor(
    private modalCtrl: ModalController,
    private profileService: MealPlannerProfileService
  ) {}

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    if (profile) {
      this.householdSize = profile.householdSize;
      this.maxReadyMinutes = profile.maxReadyMinutes;
    }
  }

  dismiss() {
    void this.modalCtrl.dismiss();
  }

  save() {
    void this.modalCtrl.dismiss({
      profile: {
        householdSize: Math.max(1, Number(this.householdSize) || 1),
        maxReadyMinutes: Math.max(15, Number(this.maxReadyMinutes) || 45),
      } satisfies Pick<MealPlannerProfile, 'householdSize' | 'maxReadyMinutes'>,
      weekServingDelta: Number(this.weekServingDelta) || 0,
      weekNote: this.weekNote.trim() || undefined,
    });
  }
}
