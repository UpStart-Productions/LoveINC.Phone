import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { ContentCardComponent } from '../content-card/content-card.component';
import type { ContentCardListItem } from '../content-card-list/content-card-list.model';
import { ContentPlanService } from '../../content-plan/content-plan.service';
import { mapContentPlanToCoverItem } from './peek-carousel.mapper';
import type {
  PeekCarouselCoverItem,
  PeekCarouselListSlide,
  PeekCarouselMediaItem,
  PeekCarouselSlideClick,
  PeekCarouselVariant,
} from './peek-carousel.model';

/** Tag slug for plans shown under Tools for Transformation carousels. */
export const PEEK_CAROUSEL_TFT_PLANS_TAG = 'tools-for-transformation';

@Component({
  selector: 'app-peek-carousel',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, IonIcon, ContentCardComponent],
  templateUrl: './peek-carousel.component.html',
  styleUrl: './peek-carousel.component.scss',
})
export class PeekCarouselComponent implements OnInit, OnChanges {
  private readonly contentPlanService = inject(ContentPlanService);

  @Input({ required: true }) variant!: PeekCarouselVariant;

  @Input() sectionTitle?: string;

  /** When set, cover slides load from plans tagged with this value. */
  @Input() tag: string | null = null;

  @Input() coverItems: PeekCarouselCoverItem[] = [];
  @Input() mediaItems: PeekCarouselMediaItem[] = [];
  @Input() listSlides: PeekCarouselListSlide[] = [];

  /** When false, cover/media slides are not tappable. List rows keep their own click rules. */
  @Input() clickable = true;

  @Input() defaultImageColor = '#8b7355';
  @Input() defaultIconBackgroundColor = '#8b7355';

  /**
   * How much of the next slide stays visible at rest, as a fraction of the track (0–0.5).
   * Default `0.08` (~8%) is half the original ~16% peek.
   */
  @Input() peek = 0.02;

  @Output() slideClick = new EventEmitter<PeekCarouselSlideClick>();

  taggedCoverItems: PeekCarouselCoverItem[] = [];

  get displayCoverItems(): PeekCarouselCoverItem[] {
    if (this.tag?.trim()) {
      return this.taggedCoverItems;
    }
    return this.coverItems;
  }

  get peekCssValue(): string {
    const clamped = Math.min(Math.max(this.peek, 0), 0.5);
    return `${clamped * 100}%`;
  }

  ngOnInit(): void {
    this.loadTaggedPlans();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tag'] && !changes['tag'].firstChange) {
      this.loadTaggedPlans();
    }
  }

  trackCoverItem(_index: number, item: PeekCarouselCoverItem): string {
    return item.id;
  }

  trackMediaItem(_index: number, item: PeekCarouselMediaItem): string {
    return item.id;
  }

  trackListSlide(_index: number, slide: PeekCarouselListSlide): string {
    return slide.id;
  }

  trackListRow(index: number, row: ContentCardListItem): string {
    return row.id ?? row.title ?? String(index);
  }

  onCoverClick(item: PeekCarouselCoverItem): void {
    if (!this.clickable) return;
    this.slideClick.emit({ variant: 'cover', item });
  }

  onMediaClick(item: PeekCarouselMediaItem): void {
    if (!this.clickable) return;
    this.slideClick.emit({ variant: 'media', item });
  }

  onListRowClick(slide: PeekCarouselListSlide, row: ContentCardListItem): void {
    if (row.route) return;
    this.slideClick.emit({ variant: 'list', slide });
  }

  private loadTaggedPlans(): void {
    const tag = this.tag?.trim();
    if (!tag) {
      this.taggedCoverItems = [];
      return;
    }

    this.contentPlanService.getPlansByTag(tag).subscribe({
      next: (plans) => {
        this.taggedCoverItems = plans
          .map((plan) => mapContentPlanToCoverItem(plan))
          .filter((item): item is PeekCarouselCoverItem => item !== null);
      },
      error: () => {
        this.taggedCoverItems = [];
      },
    });
  }
}
