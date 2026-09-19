import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ContentCardComponent,
  type ContentCardAsideAvatarSize,
} from '../content-card/content-card.component';
import type { ContentCardListItem } from './content-card-list.model';

@Component({
  selector: 'app-content-card-list',
  templateUrl: './content-card-list.component.html',
  styleUrls: ['./content-card-list.component.scss'],
  standalone: true,
  imports: [CommonModule, ContentCardComponent],
})
export class ContentCardListComponent {
  @Input({ required: true }) items: ContentCardListItem[] = [];
  @Input() compactCategoryLabel = false;
  @Input() defaultNavigationFrom?: string;
  @Input() defaultIconBackgroundColor = '#8b7355';
  @Input() defaultAsideAvatarSize: ContentCardAsideAvatarSize = 'small';

  /**
   * When true, removes top padding and square shell corners at the top.
   * Also applied globally for lists placed directly under `ion-content.app-card-page`.
   */
  @Input() flushTop = false;

  /** Light grey inset panel (e.g. content-detail related links, instructor-style). */
  @Input() lightShell = false;

  /** Emitted when a row without `route` is tapped. */
  @Output() itemClick = new EventEmitter<ContentCardListItem>();

  @Output() saveClick = new EventEmitter<ContentCardListItem>();

  trackItem(index: number, item: ContentCardListItem): string {
    return item.id ?? item.title ?? String(index);
  }

  onCardClick(item: ContentCardListItem): void {
    if (!item.route) {
      this.itemClick.emit(item);
    }
  }
}
