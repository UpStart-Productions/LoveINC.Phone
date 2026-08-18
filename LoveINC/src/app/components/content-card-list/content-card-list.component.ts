import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentCardComponent } from '../content-card/content-card.component';
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
  @Input() defaultAsideAvatarSize: 'small' | 'large' = 'small';

  /** Emitted when a row without `route` is tapped. */
  @Output() itemClick = new EventEmitter<ContentCardListItem>();

  trackItem(index: number, item: ContentCardListItem): string {
    return item.id ?? item.title ?? String(index);
  }

  onCardClick(item: ContentCardListItem): void {
    if (!item.route) {
      this.itemClick.emit(item);
    }
  }
}
