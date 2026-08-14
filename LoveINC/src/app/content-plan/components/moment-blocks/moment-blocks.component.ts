import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { videoEmbedUrlFromLink } from '../../video-embed.util';
import type { ContentPlanBlock } from '../../content-plan.model';

@Component({
  selector: 'app-moment-blocks',
  standalone: true,
  imports: [
    CommonModule,
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
export class MomentBlocksComponent {
  @Input({ required: true }) blocks: ContentPlanBlock[] = [];

  get sortedBlocks(): ContentPlanBlock[] {
    return [...this.blocks].sort((a, b) => a.order - b.order);
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
}
