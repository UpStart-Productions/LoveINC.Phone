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
import { mapContentPlanToCoverItem, mapContentPlanToMediaItem, mapPlansToListSlides } from './peek-carousel.mapper';
import type {
  PeekCarouselCoverItem,
  PeekCarouselListSlide,
  PeekCarouselMediaItem,
  PeekCarouselSlideClick,
  PeekCarouselVariant,
} from './peek-carousel.model';

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

  /** When set, slides load from plans in this theme. */
  @Input() themeId: string | null = null;

  /** When set, slides load from plans in this theme (case-insensitive name match). */
  @Input() themeName: string | null = null;

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

  themedCoverItems: PeekCarouselCoverItem[] = [];
  themedMediaItems: PeekCarouselMediaItem[] = [];
  themedListSlides: PeekCarouselListSlide[] = [];

  get displayCoverItems(): PeekCarouselCoverItem[] {
    if (this.hasThemedPlans()) {
      return this.themedCoverItems;
    }
    return this.coverItems;
  }

  get displayMediaItems(): PeekCarouselMediaItem[] {
    if (this.hasThemedPlans()) {
      return this.themedMediaItems;
    }
    return this.mediaItems;
  }

  get displayListSlides(): PeekCarouselListSlide[] {
    if (this.hasThemedPlans()) {
      return this.themedListSlides;
    }
    return this.listSlides;
  }

  get peekCssValue(): string {
    const clamped = Math.min(Math.max(this.peek, 0), 0.5);
    return `${clamped * 100}%`;
  }

  ngOnInit(): void {
    this.loadThemedPlans();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['themeName'] && !changes['themeName'].firstChange) ||
      (changes['themeId'] && !changes['themeId'].firstChange)
    ) {
      this.loadThemedPlans();
    }
  }

  /** Re-fetch themed plans (e.g. pull-to-refresh on Home). */
  refresh(): void {
    this.loadThemedPlans(true);
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

  private loadThemedPlans(refresh = false): void {
    const themeId = this.themeId?.trim();
    const themeName = this.themeName?.trim();
    if (!themeId && !themeName) {
      this.themedCoverItems = [];
      this.themedMediaItems = [];
      this.themedListSlides = [];
      return;
    }

    const plans$ = themeId
      ? this.contentPlanService.getPlansByThemeId(themeId, refresh)
      : this.contentPlanService.getPlansByThemeName(themeName!, refresh);

    plans$.subscribe({
      next: (plans) => {
        this.themedCoverItems = plans
          .map((plan) => mapContentPlanToCoverItem(plan))
          .filter((item): item is PeekCarouselCoverItem => item !== null);
        this.themedMediaItems = plans.map((plan) => mapContentPlanToMediaItem(plan));
        this.themedListSlides = mapPlansToListSlides(plans);
      },
      error: () => {
        this.themedCoverItems = [];
        this.themedMediaItems = [];
        this.themedListSlides = [];
      },
    });
  }

  private hasThemedPlans(): boolean {
    return !!(this.themeId?.trim() || this.themeName?.trim());
  }
}
