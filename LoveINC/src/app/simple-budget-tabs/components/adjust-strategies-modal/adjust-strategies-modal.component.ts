import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonCheckbox,
  ModalController,
} from '@ionic/angular/standalone';
import {
  WeekPlanService,
  QUICK_ADJUST_OPTIONS,
} from '@upstart-productions/simple-budget';
import type { WeekPlan } from '@upstart-productions/simple-budget';

@Component({
  selector: 'app-adjust-strategies-modal',
  templateUrl: './adjust-strategies-modal.component.html',
  styleUrls: ['./adjust-strategies-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
  ],
})
export class AdjustStrategiesModalComponent implements OnInit {
  @Input() plan: WeekPlan | null = null;

  selectedIds = new Set<string>();
  readonly options = QUICK_ADJUST_OPTIONS;

  constructor(
    private modalCtrl: ModalController,
    private weekPlanService: WeekPlanService
  ) {}

  ngOnInit() {
    const notes = (this.plan?.strategyNotes ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    this.selectedIds = new Set(notes);
  }

  toggleOption(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else if (this.selectedIds.size < 2) {
      this.selectedIds.add(id);
    }
    this.selectedIds = new Set(this.selectedIds);
    this.save();
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  close() {
    this.modalCtrl.dismiss(this.getStrategyNotes(), 'close');
  }

  private getStrategyNotes(): string {
    return [...this.selectedIds].join(', ');
  }

  private async save() {
    if (!this.plan) return;
    this.plan.strategyNotes = this.getStrategyNotes();
    try {
      await this.weekPlanService.upsertWeek(this.plan);
    } catch (err) {
      console.warn('Adjust strategies save error:', err);
    }
  }
}
