import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCheckbox,
  IonItem,
  IonLabel,
  IonList,
  IonRadio,
  IonRadioGroup,
  IonTextarea,
} from '@ionic/angular/standalone';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { SafeResourceUrlPipe } from '../../../shared/pipes/safe-resource-url.pipe';
import { parseScriptureRefs } from '../../../shared/utils/scripture-ref.util';
import { ScriptureVerseModalService } from '../../../services/scripture-verse-modal.service';
import { videoEmbedUrlFromLink } from '../../video-embed.util';
import {
  findMomentBlock,
  isMomentMetaBlock,
  resolveBlockRichHtml,
} from '../../content-plan.mapper';
import type { ContentPlanBlock } from '../../content-plan.model';
import { buildContentPlanInputKey } from '../../content-plan-response.util';
import {
  ContentPlanResponseService,
  type ContentPlanResponseContext,
} from '../../content-plan-response.service';

@Component({
  selector: 'app-moment-blocks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonLabel,
    IonTextarea,
    IonList,
    IonCheckbox,
    IonRadioGroup,
    IonRadio,
    SafeHtmlPipe,
    SafeResourceUrlPipe,
  ],
  templateUrl: './moment-blocks.component.html',
  styleUrl: './moment-blocks.component.scss',
})
export class MomentBlocksComponent implements OnChanges {
  private readonly scriptureVerseModal = inject(ScriptureVerseModalService);
  private readonly responseService = inject(ContentPlanResponseService);

  @Input({ required: true }) blocks: ContentPlanBlock[] = [];
  @Input() planId = '';
  @Input() planTitle = '';
  @Input() themeName = '';
  @Input() planMomentId = '';

  responses: Record<string, string | string[]> = {};
  private loadedPlanId = '';

  get sortedBlocks(): ContentPlanBlock[] {
    return [...this.blocks].sort((a, b) => a.order - b.order);
  }

  get displayBlocks(): ContentPlanBlock[] {
    return this.sortedBlocks.filter((block) => !isMomentMetaBlock(block));
  }

  get titleBlockHtml(): string | undefined {
    return resolveBlockRichHtml(findMomentBlock(this.blocks, 'title'));
  }

  get subtitleBlockHtml(): string | undefined {
    return resolveBlockRichHtml(findMomentBlock(this.blocks, 'subtitle'));
  }

  get canPersist(): boolean {
    return !!this.planId.trim() && !!this.planMomentId.trim();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['planId'] || changes['planMomentId']) {
      void this.loadResponses();
    }
  }

  contentString(block: ContentPlanBlock, key: string): string {
    const value = block.content[key];
    return typeof value === 'string' ? value.trim() : '';
  }

  promptLabel(block: ContentPlanBlock): string {
    return this.contentString(block, 'label') || 'Choose one';
  }

  options(block: ContentPlanBlock): string[] {
    const raw = block.content['options'];
    if (!Array.isArray(raw)) return [];
    return raw.filter((value): value is string => typeof value === 'string' && !!value.trim());
  }

  mediaUrl(block: ContentPlanBlock): string | null {
    const url = this.contentString(block, 'url');
    return url || null;
  }

  mediaFilename(block: ContentPlanBlock): string {
    return this.contentString(block, 'filename');
  }

  videoEmbedUrl(block: ContentPlanBlock): string | null {
    return videoEmbedUrlFromLink(this.contentString(block, 'url'));
  }

  isScriptureBlock(block: ContentPlanBlock): boolean {
    return block.blockId === 'scripture';
  }

  scriptureRefs(block: ContentPlanBlock): string[] {
    return parseScriptureRefs(this.contentString(block, 'text'));
  }

  openVerseModal(reference: string): void {
    void this.scriptureVerseModal.open(reference);
  }

  getTextResponse(block: ContentPlanBlock): string {
    const value = this.responses[this.inputKey(block)];
    return typeof value === 'string' ? value : '';
  }

  setTextResponse(block: ContentPlanBlock, value: string): void {
    this.responses[this.inputKey(block)] = value;
  }

  onTextBlur(block: ContentPlanBlock): void {
    if (!this.canPersist) return;
    const value = this.getTextResponse(block);
    void this.responseService.saveTextResponse(this.persistContext(), block, value);
  }

  getRadioResponse(block: ContentPlanBlock): string {
    return this.getTextResponse(block);
  }

  onRadioChange(block: ContentPlanBlock, value: string | number | null | undefined): void {
    if (!this.canPersist) return;
    const next = typeof value === 'string' ? value : '';
    this.responses[this.inputKey(block)] = next;
    void this.responseService.saveRadioResponse(this.persistContext(), block, next);
  }

  isChecked(block: ContentPlanBlock, option: string): boolean {
    const value = this.responses[this.inputKey(block)];
    return Array.isArray(value) && value.includes(option);
  }

  onCheckboxChange(block: ContentPlanBlock, option: string, checked: boolean): void {
    if (!this.canPersist) return;
    const key = this.inputKey(block);
    const current = this.responses[key];
    const selected = Array.isArray(current) ? [...current] : [];
    const next = checked
      ? Array.from(new Set([...selected, option]))
      : selected.filter((row) => row !== option);
    this.responses[key] = next;
    void this.responseService.saveCheckboxResponse(this.persistContext(), block, next);
  }

  private inputKey(block: ContentPlanBlock): string {
    return buildContentPlanInputKey(this.planMomentId, block);
  }

  private persistContext(): ContentPlanResponseContext {
    return {
      planId: this.planId,
      planTitle: this.planTitle,
      themeName: this.themeName,
      planMomentId: this.planMomentId,
    };
  }

  private async loadResponses(): Promise<void> {
    const planId = this.planId.trim();
    if (!planId) {
      this.responses = {};
      this.loadedPlanId = '';
      return;
    }

    if (this.loadedPlanId === planId && Object.keys(this.responses).length > 0) {
      return;
    }

    this.responses = await this.responseService.loadResponses(planId);
    this.loadedPlanId = planId;
  }
}
