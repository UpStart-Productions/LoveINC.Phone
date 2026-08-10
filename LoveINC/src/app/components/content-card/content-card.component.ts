import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { LocationMapModalService } from '../../services/location-map-modal.service';

/** Optional fragments for coloring numeric parts (e.g. budget amounts). */
export type ContentCardTextSegment = {
  text: string;
  tone?: 'positive' | 'negative';
};

@Component({
  selector: 'app-content-card',
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonCard, IonCardContent, IonIcon],
})
export class ContentCardComponent {
  /** Small category label above title (e.g. "Guided Scripture", "Guided Prayer") */
  @Input() category?: string;

  /** Optional icon name for category line (e.g. "water-outline", "checkmark-done-outline") */
  @Input() categoryIcon?: string;

  /** Optional extra text before category (e.g. "0", "Day 5") */
  @Input() categoryExtra?: string;

  /** Main title (bold) */
  @Input() title!: string;

  /** When set, title is built from segments (e.g. colored amounts); overrides plain `title` display. */
  @Input() titleSegments?: ContentCardTextSegment[];

  /** Optional line directly under the title (e.g. address), left column only */
  @Input() underTitle?: string;

  /** Detail text below title (e.g. "2-5 min", "4-6 min") */
  @Input() detail?: string;

  /** When set, detail is built from segments; overrides plain `detail` display. */
  @Input() detailSegments?: ContentCardTextSegment[];

  /** Show play icon before detail when present */
  @Input() showDetailPlayIcon = true;

  /** Image URL for right-side visual. If set, icon/iconBg are ignored. */
  @Input() imageUrl?: string;

  /** Icon name for right-side when no image (e.g. "hand-left-outline") */
  @Input() iconName?: string;

  /** Background color for icon placeholder when using iconName */
  @Input() iconBackgroundColor = '#8b7355';

  /** Card clickable / tappable */
  @Input() clickable = true;

  /** Route to navigate to on click (e.g. '/tabs/goal-tracker') */
  @Input() route?: string;

  /** When true, tapping `underTitle` opens the map modal (stops card navigation). */
  @Input() tapUnderTitleToOpenMap = false;

  /** Optional; shown in map popover when opening via `tapUnderTitleToOpenMap`. */
  @Input() mapPhone?: string;

  @Input() mapWebsite?: string;

  /**
   * Smaller top category line (one step on the type scale). Used on Tools and home promos
   * (e.g. Verse of the Day, Simple Budget) that share the same look.
   */
  @Input() compactCategoryLabel = false;

  /** One step smaller than default detail line (e.g. Simple Budget home card subtext). */
  @Input() compactDetail = false;

  /** Flush stacked row inside `app-content-card-list` (divider lines, no card shadow). */
  @Input() listRow = false;

  /** Horizontal divider under this row when stacked in a list. */
  @Input() listDivider = false;

  constructor(
    private router: Router,
    private locationMapModal: LocationMapModalService
  ) {}

  /** When set, appended as `?from=` unless the route already includes one. */
  @Input() navigationFrom?: string;

  /** Keep current URL query params when navigating (e.g. journal `?from=tools`). */
  @Input() preserveQueryParams = false;

  /** Fired when the card is tapped and no `route` is set. */
  @Output() cardClick = new EventEmitter<void>();

  handleClick() {
    if (!this.clickable) {
      return;
    }
    if (this.route) {
      const tree = this.router.parseUrl(this.route);
      if (this.navigationFrom && !tree.queryParams['from']) {
        tree.queryParams = { ...tree.queryParams, from: this.navigationFrom };
      }
      if (!tree.queryParams['returnUrl']) {
        tree.queryParams = { ...tree.queryParams, returnUrl: this.router.url };
      }
      if (this.preserveQueryParams) {
        const current = this.router.parseUrl(this.router.url);
        tree.queryParams = { ...current.queryParams, ...tree.queryParams };
      }
      void this.router.navigateByUrl(tree);
      return;
    }
    this.cardClick.emit();
  }

  async onUnderTitleMapTap(event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.tapUnderTitleToOpenMap || !this.underTitle?.trim()) return;
    await this.locationMapModal.present({
      title: this.title,
      address: this.underTitle,
      phone: this.mapPhone?.trim() || null,
      website: this.mapWebsite?.trim() || null,
    });
  }
}
