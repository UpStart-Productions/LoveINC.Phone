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
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import {
  MEALS_PER_WEEK,
  MealPlannerPlanService,
  MealPlannerProfileService,
} from '@upstart-productions/meal-planner';

@Component({
  selector: 'app-week-settings-modal',
  templateUrl: './week-settings-modal.component.html',
  styleUrls: ['./week-settings-modal.component.scss'],
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
    IonInput,
    IonTextarea,
  ],
})
export class WeekSettingsModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) weekStartDate!: string;
  @Input() weekServingDelta = 0;
  @Input() weekNote = '';
  @Input() mealsPerWeek = MEALS_PER_WEEK;

  householdSize = 2;
  maxReadyMinutes = 45;

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private changed = false;
  private keyboardShowListener?: PluginListenerHandle;
  private keyboardHideListener?: PluginListenerHandle;

  constructor(
    private modalCtrl: ModalController,
    private profileService: MealPlannerProfileService,
    private planService: MealPlannerPlanService,
    private host: ElementRef<HTMLElement>
  ) {}

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    if (profile) {
      this.householdSize = profile.householdSize;
      this.maxReadyMinutes = profile.maxReadyMinutes;
    }
    void this.attachKeyboardListeners();
  }

  ngOnDestroy() {
    void this.flushPendingSave();
    void this.detachKeyboardListeners();
    this.applyModalKeyboardOffset(0);
  }

  onFieldChange() {
    this.scheduleSave();
  }

  async close() {
    await this.flushPendingSave();
    void this.modalCtrl.dismiss({ changed: this.changed });
  }

  private scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.persist();
    }, 350);
  }

  private async flushPendingSave() {
    if (!this.saveTimer) {
      return;
    }
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await this.persist();
  }

  private async persist() {
    await this.profileService.saveProfile({
      householdSize: Math.max(1, Number(this.householdSize) || 1),
      maxReadyMinutes: Math.max(15, Number(this.maxReadyMinutes) || 45),
    });
    await this.planService.updateWeekSettings(this.weekStartDate, {
      weekServingDelta: Math.max(0, Number(this.weekServingDelta) || 0),
      mealsPerWeek: Number(this.mealsPerWeek) || MEALS_PER_WEEK,
      weekNote: this.weekNote.trim() || undefined,
    });
    this.changed = true;
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
