import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { ContentCardComponent } from '../content-card/content-card.component';
import type { ContentCardListItem } from '../content-card-list/content-card-list.model';
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
export class PeekCarouselComponent {
  @Input({ required: true }) variant!: PeekCarouselVariant;

  @Input() sectionTitle?: string;

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

  get peekCssValue(): string {
    const clamped = Math.min(Math.max(this.peek, 0), 0.5);
    return `${clamped * 100}%`;
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
}
