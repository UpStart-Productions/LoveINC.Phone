import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import {
  MEAL_RECAP_RATING_DIMENSIONS,
  MEAL_RECAP_REACTIONS,
  MealPlannerPlanService,
  type MealRecapRatingKey,
  type MealRecapThumb,
} from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-meal-recap-sheet',
  templateUrl: './meal-recap-sheet.component.html',
  styleUrls: ['./meal-recap-sheet.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonLabel,
    IonTextarea,
  ],
})
export class MealRecapSheetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) planMealId!: number;
  @Input() initialReactionEmoji?: string;
  @Input() initialEffortRating?: MealRecapThumb;
  @Input() initialTimeRating?: MealRecapThumb;
  @Input() initialCostRating?: MealRecapThumb;
  @Input() initialNotes?: string;

  readonly reactions = MEAL_RECAP_REACTIONS;
  readonly ratingDimensions = MEAL_RECAP_RATING_DIMENSIONS;
  readonly thumbDownEmoji = '👎';
  readonly thumbUpEmoji = '👍';

  selectedReactionEmoji?: string;
  effortRating?: MealRecapThumb;
  timeRating?: MealRecapThumb;
  costRating?: MealRecapThumb;
  notes = '';

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private keyboardShowListener?: PluginListenerHandle;
  private keyboardHideListener?: PluginListenerHandle;

  constructor(
    private modalCtrl: ModalController,
    private planService: MealPlannerPlanService,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.selectedReactionEmoji = this.initialReactionEmoji;
    this.effortRating = this.initialEffortRating;
    this.timeRating = this.initialTimeRating;
    this.costRating = this.initialCostRating;
    this.notes = this.initialNotes ?? '';
    void this.attachKeyboardListeners();
    this.scheduleSave();
  }

  ngOnDestroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    void this.detachKeyboardListeners();
    this.applyModalKeyboardOffset(0);
  }

  selectReaction(emoji: string): void {
    this.selectedReactionEmoji = emoji;
    this.scheduleSave();
  }

  selectRating(key: MealRecapRatingKey, thumb: MealRecapThumb): void {
    const current = this.getRating(key);
    this.setRating(key, current === thumb ? undefined : thumb);
    this.scheduleSave();
  }

  onNotesChange(): void {
    this.scheduleSave();
  }

  close(): void {
    void this.modalCtrl.dismiss({ saved: true });
  }

  isReactionSelected(emoji: string): boolean {
    return this.selectedReactionEmoji === emoji;
  }

  isRatingSelected(key: MealRecapRatingKey, thumb: MealRecapThumb): boolean {
    return this.getRating(key) === thumb;
  }

  private getRating(key: MealRecapRatingKey): MealRecapThumb | undefined {
    if (key === 'effort') {
      return this.effortRating;
    }
    if (key === 'time') {
      return this.timeRating;
    }
    return this.costRating;
  }

  private setRating(key: MealRecapRatingKey, value: MealRecapThumb | undefined): void {
    if (key === 'effort') {
      this.effortRating = value;
      return;
    }
    if (key === 'time') {
      this.timeRating = value;
      return;
    }
    this.costRating = value;
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
      effortRating: this.effortRating,
      timeRating: this.timeRating,
      costRating: this.costRating,
      notes: this.notes,
    });
  }

  private async attachKeyboardListeners() {
    try {
      this.keyboardShowListener = await Keyboard.addListener('keyboardWillShow', (event) => {
        this.applyModalKeyboardOffset(event.keyboardHeight);
      });
      this.keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
        this.applyModalKeyboardOffset(0);
      });
    } catch {
      // Keyboard plugin may not be available (e.g. web).
    }
  }

  private async detachKeyboardListeners() {
    await this.keyboardShowListener?.remove();
    await this.keyboardHideListener?.remove();
    this.keyboardShowListener = undefined;
    this.keyboardHideListener = undefined;
  }

  private applyModalKeyboardOffset(height: number) {
    const modal = this.host.nativeElement.closest('ion-modal');
    if (!modal) {
      return;
    }
    (modal as HTMLElement).style.setProperty('--keyboard-offset', `${height}px`);
  }
}
