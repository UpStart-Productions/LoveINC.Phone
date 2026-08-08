import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonProgressBar,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { SafeHtmlPipe } from '../shared/pipes/safe-html.pipe';
import { PlatformApiService } from '../services/platform';
import type {
  PlatformTransformationTool,
  PlatformTransformationToolStep,
} from '../services/platform/types';
import { GrovLinkDatabaseService } from '../services/grovlink-database.service';
import { ScriptureVerseModalComponent } from '../components/scripture-verse-modal/scripture-verse-modal.component';

type ScreenPosition = 'cover' | 'step' | 'closing';

@Component({
  selector: 'app-transformation-tool',
  templateUrl: './transformation-tool.page.html',
  styleUrls: ['./transformation-tool.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonProgressBar,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonTextarea,
    IonRadioGroup,
    IonRadio,
    IonCheckbox,
    SafeHtmlPipe,
  ],
})
export class TransformationToolPage implements OnInit {
  tool: PlatformTransformationTool | null = null;
  loading = true;
  notFound = false;

  /** 0 = cover, 1..steps.length = step screens, steps.length + 1 = closing */
  screenIndex = 0;

  private responses: Record<string, string | string[]> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platformApi: PlatformApiService,
    private db: GrovLinkDatabaseService,
    private modalController: ModalController
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.notFound = true;
      return;
    }
    this.platformApi.getTransformationTools().subscribe({
      next: async (tools) => {
        const found = (tools ?? []).find((t) => t.id === id) ?? null;
        this.tool = found;
        this.notFound = !found;
        if (found) {
          this.responses = await this.db.getTransformationToolResponses(found.id);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('TransformationToolPage: failed to load tool', err);
        this.loading = false;
        this.notFound = true;
      },
    });
  }

  get steps(): PlatformTransformationToolStep[] {
    return this.tool?.steps ?? [];
  }

  get screenPosition(): ScreenPosition {
    if (this.screenIndex === 0) return 'cover';
    if (this.screenIndex === this.steps.length + 1) return 'closing';
    return 'step';
  }

  get currentStep(): PlatformTransformationToolStep | null {
    if (this.screenPosition !== 'step') return null;
    return this.steps[this.screenIndex - 1] ?? null;
  }

  get progressValue(): number {
    if (!this.steps.length) return 0;
    return this.screenIndex / (this.steps.length + 1);
  }

  goNext(): void {
    if (this.screenIndex < this.steps.length + 1) {
      this.screenIndex++;
    }
  }

  goBack(): void {
    if (this.screenIndex > 0) {
      this.screenIndex--;
    }
  }

  goToList(): void {
    void this.router.navigate(['/tabs/transformation-tools']);
  }

  async openVerseModal(reference: string): Promise<void> {
    const modal = await this.modalController.create({
      component: ScriptureVerseModalComponent,
      componentProps: { reference },
    });
    await modal.present();
  }

  private responseKey(step: PlatformTransformationToolStep, inputIndex: number): string {
    return `${step.order}:${inputIndex}`;
  }

  getTextResponse(step: PlatformTransformationToolStep, inputIndex: number): string {
    const value = this.responses[this.responseKey(step, inputIndex)];
    return typeof value === 'string' ? value : '';
  }

  setTextResponse(step: PlatformTransformationToolStep, inputIndex: number, value: string): void {
    this.saveResponse(step, inputIndex, value);
  }

  isChecked(step: PlatformTransformationToolStep, inputIndex: number, option: string): boolean {
    const value = this.responses[this.responseKey(step, inputIndex)];
    return Array.isArray(value) && value.includes(option);
  }

  toggleCheckboxResponse(
    step: PlatformTransformationToolStep,
    inputIndex: number,
    option: string,
    checked: boolean
  ): void {
    const key = this.responseKey(step, inputIndex);
    const current = this.responses[key];
    const selected = Array.isArray(current) ? [...current] : [];
    const next = checked
      ? Array.from(new Set([...selected, option]))
      : selected.filter((o) => o !== option);
    this.saveResponse(step, inputIndex, next);
  }

  private saveResponse(
    step: PlatformTransformationToolStep,
    inputIndex: number,
    value: string | string[]
  ): void {
    const key = this.responseKey(step, inputIndex);
    this.responses[key] = value;
    if (!this.tool) return;
    this.db.saveTransformationToolResponse(this.tool.id, key, value).catch((err) => {
      console.warn('TransformationToolPage: failed to save response', err);
    });
  }
}
