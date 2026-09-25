import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonRange,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import {
  complexityToIndex,
  indexToComplexity,
  MEAL_RECAP_REACTIONS,
  MealPlannerPlanService,
  type MealRecapComplexity,
} from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-meal-recap-sheet',
  templateUrl: './meal-recap-sheet.component.html',
  styleUrls: ['./meal-recap-sheet.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonRange,
  ],
})
export class MealRecapSheetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) planMealId!: number;
  @Input({ required: true }) recipeTimeMinutes!: number;
  @Input() initialReactionEmoji?: string;
  @Input() initialActualCookMinutes?: number;
  @Input() initialComplexity?: MealRecapComplexity;

  readonly reactions = MEAL_RECAP_REACTIONS;

  selectedReactionEmoji?: string;
  cookMinutes = 0;
  complexityIndex = 1;

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private modalCtrl: ModalController,
    private planService: MealPlannerPlanService
  ) {}

  get cookTimeMin(): number {
    return Math.max(5, this.recipeTimeMinutes - 30);
  }

  get cookTimeMax(): number {
    return this.recipeTimeMinutes + 30;
  }

  ngOnInit(): void {
    this.selectedReactionEmoji = this.initialReactionEmoji;
    this.cookMinutes = this.initialActualCookMinutes ?? this.recipeTimeMinutes;
    this.complexityIndex = complexityToIndex(this.initialComplexity);
    this.scheduleSave();
  }

  ngOnDestroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
  }

  selectReaction(emoji: string): void {
    this.selectedReactionEmoji = emoji;
    this.scheduleSave();
  }

  onCookMinutesChange(event: CustomEvent): void {
    this.cookMinutes = Number(event.detail.value);
    this.scheduleSave();
  }

  onComplexityChange(event: CustomEvent): void {
    this.complexityIndex = Number(event.detail.value);
    this.scheduleSave();
  }

  close(): void {
    void this.modalCtrl.dismiss({ saved: true });
  }

  isReactionSelected(emoji: string): boolean {
    return this.selectedReactionEmoji === emoji;
  }

  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      void this.persist();
    }, 350);
  }

  private async persist(): Promise<void> {
    await this.planService.saveMealRecap(this.planMealId, {
      reactionEmoji: this.selectedReactionEmoji,
      actualCookMinutes: this.cookMinutes,
      complexity: indexToComplexity(this.complexityIndex),
    });
  }
}
