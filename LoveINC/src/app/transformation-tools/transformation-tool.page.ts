import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { AppBackButtonComponent } from '../components/app-back-button/app-back-button.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonContent,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonCard,
} from '@ionic/angular/standalone';
import { SafeHtmlPipe } from '../shared/pipes/safe-html.pipe';
import { PlatformApiService } from '../services/platform';
import type {
  PlatformTransformationTool,
  PlatformTransformationToolStep,
} from '../services/platform/types';
import { GrovLinkDatabaseService } from '../services/grovlink-database.service';
import { ScriptureVerseModalComponent } from '../components/scripture-verse-modal/scripture-verse-modal.component';

export interface TftSection {
  id: string;
  label: string;
}

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
    IonButtons,
    IonIcon,
    IonContent,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonTextarea,
    IonRadioGroup,
    IonRadio,
    IonCheckbox,
    IonCard,
    SafeHtmlPipe,
    AppBackButtonComponent]})
export class TransformationToolPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild('tabBar') private tabBar?: ElementRef<HTMLElement>;
  @ViewChild('tabIndicator') private tabIndicator?: ElementRef<HTMLElement>;

  tool: PlatformTransformationTool | null = null;
  loading = true;
  notFound = false;
  activeSectionId = 'tft-intro';

  private responses: Record<string, string | string[]> = {};
  private scrollLock = false;
  private scrollEl?: HTMLElement;
  private onScrollHandler = (): void => {
    if (this.scrollLock) return;
    this.syncActiveSectionFromScroll();
  };

  constructor(
    private route: ActivatedRoute,
    private platformApi: PlatformApiService,
    private db: GrovLinkDatabaseService,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
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
        setTimeout(() => void this.attachScrollSpy(), 0);
      },
      error: (err) => {
        console.error('TransformationToolPage: failed to load tool', err);
        this.loading = false;
        this.notFound = true;
      }});
  }

  ngOnDestroy(): void {
    this.detachScrollSpy();
  }

  onContentScroll(): void {
    this.onScrollHandler();
  }

  get steps(): PlatformTransformationToolStep[] {
    return this.tool?.steps ?? [];
  }

  get sections(): TftSection[] {
    if (!this.tool) return [];
    const list: TftSection[] = [{ id: 'tft-intro', label: 'Intro' }];
    for (const step of this.steps) {
      list.push({ id: this.stepSectionId(step), label: step.title });
    }
    list.push({ id: 'tft-closing', label: 'Closing' });
    return list;
  }

  stepSectionId(step: PlatformTransformationToolStep): string {
    return `tft-step-${step.order}`;
  }

  async scrollToSection(sectionId: string): Promise<void> {
    this.activeSectionId = sectionId;
    this.updateTabIndicator();
    this.scrollLock = true;
    const target = document.getElementById(sectionId);
    if (!target || !this.content) {
      this.scrollLock = false;
      return;
    }
    const scrollEl = await this.content.getScrollElement();
    const targetTop = target.getBoundingClientRect().top;
    const scrollTop = scrollEl.getBoundingClientRect().top;
    const y = scrollEl.scrollTop + targetTop - scrollTop - this.getStickyOffset();
    await this.content.scrollToPoint(0, Math.max(0, y), 400);
    this.scrollTabIntoView(sectionId);
    this.updateTabIndicator();
    setTimeout(() => {
      this.scrollLock = false;
    }, 450);
  }

  async openVerseModal(reference: string): Promise<void> {
    try {
      const modal = await this.modalController.create({
        component: ScriptureVerseModalComponent,
        componentProps: { reference },
        cssClass: 'scripture-verse-modal-sheet',
        showBackdrop: true,
        backdropDismiss: true,
        breakpoints: [0, 0.67],
        initialBreakpoint: 0.67,
        handle: true});
      await modal.present();
    } catch (err) {
      console.error('TransformationToolPage: openVerseModal failed', err);
    }
  }

  private getStickyOffset(): number {
    const header = document.querySelector('app-transformation-tool ion-header');
    return header?.getBoundingClientRect().height ?? 112;
  }

  private syncActiveSectionFromScroll(): void {
    if (!this.tool) return;

    const activationLine = this.getStickyOffset() + 8;
    let current = this.sections[0]?.id ?? 'tft-intro';

    for (const section of this.sections) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= activationLine) {
        current = section.id;
      }
    }

    if (current !== this.activeSectionId) {
      this.activeSectionId = current;
      this.scrollTabIntoView(current);
      this.updateTabIndicator();
      this.cdr.markForCheck();
    }
  }

  private async attachScrollSpy(): Promise<void> {
    this.detachScrollSpy();
    if (!this.content || !this.tool) return;
    this.scrollEl = await this.content.getScrollElement();
    this.scrollEl.addEventListener('scroll', this.onScrollHandler, { passive: true });
    this.syncActiveSectionFromScroll();
    this.updateTabIndicator();
  }

  private detachScrollSpy(): void {
    this.scrollEl?.removeEventListener('scroll', this.onScrollHandler);
    this.scrollEl = undefined;
  }

  private scrollTabIntoView(sectionId: string): void {
    const bar = this.tabBar?.nativeElement;
    if (!bar) return;
    const index = this.sections.findIndex((s) => s.id === sectionId);
    if (index < 0) return;
    const tab = bar.querySelectorAll('.tft-tab').item(index) as HTMLElement | null;
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    setTimeout(() => this.updateTabIndicator(), 300);
  }

  private updateTabIndicator(): void {
    requestAnimationFrame(() => {
      const bar = this.tabBar?.nativeElement;
      const indicator = this.tabIndicator?.nativeElement;
      if (!bar || !indicator) return;

      const index = this.sections.findIndex((s) => s.id === this.activeSectionId);
      if (index < 0) {
        indicator.style.opacity = '0';
        return;
      }

      const tab = bar.querySelectorAll('.tft-tab').item(index) as HTMLElement | null;
      if (!tab) return;

      indicator.style.opacity = '1';
      indicator.style.width = `${tab.offsetWidth}px`;
      indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
    });
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
