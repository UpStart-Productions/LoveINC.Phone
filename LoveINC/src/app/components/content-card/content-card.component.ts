import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { navigateAppForward } from '../../shared/utils/navigation-forward.util';
import { IonBadge, IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { LocationMapModalService } from '../../services/location-map-modal.service';

/** Optional fragments for coloring numeric parts (e.g. budget amounts). */
export type ContentCardTextSegment = {
  text: string;
  tone?: 'positive' | 'negative';
};

export type ContentCardAsideAvatarSize = 'small' | 'large';

@Component({
  selector: 'app-content-card',
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonBadge, IonCard, IonCardContent, IonIcon, LucideAngularModule],
})
export class ContentCardComponent {
  private readonly navController = inject(NavController);
  /** Small category label above title (e.g. "Guided Scripture", "Guided Prayer") */
  @Input() category?: string;

  /** Optional icon name for category line (e.g. "water-outline", "checkmark-done-outline") */
  @Input() categoryIcon?: string;

  /** Optional Lucide icon name for category line (e.g. "sprout") */
  @Input() lucideCategoryIcon?: string;

  /** Optional extra text before category (e.g. "0", "Day 5") */
  @Input() categoryExtra?: string;

  /** Lucide icon inline before the title (e.g. graduation-cap for learning journal entries). */
  @Input() lucideTitleIcon?: string;

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

  /** Lucide icon name for right-side when no image (e.g. "sprout") */
  @Input() lucideIcon?: string;

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

  /** Flush stacked row inside `app-content-card-list` (divider lines, no card shadow). */
  @Input() listRow = false;

  /** Horizontal divider under this row when stacked in a list. */
  @Input() listDivider = false;

  /** Right-cell badge text (e.g. journal entry date). Shown with or without avatar. */
  @Input() asideBadge?: string;

  /** Ionic badge color for `asideBadge` (default `success`). */
  @Input() asideBadgeColor = 'success';

  /** Ionicon overlay on photo avatar lower-left (e.g. `checkmark-circle`). */
  @Input() avatarOverlayIcon?: string;

  /** Ionic color for `avatarOverlayIcon` (default `success`). */
  @Input() avatarOverlayIconColor = 'success';

  /** Optional author line under the title (avatar left of "By {name}"). */
  @Input() authorName?: string;

  @Input() authorAvatarUrl?: string;

  /** Creation date above the aside avatar, inline with the theme/category row (e.g. "Jan 1"). */
  @Input() createdAtLabel?: string;

  /** Right-aside avatar size. `large` is 40% bigger than `small`. */
  @Input() asideAvatarSize: ContentCardAsideAvatarSize = 'small';

  get asideLucideIconSize(): number {
    return this.asideAvatarSize === 'large' ? 34 : 24;
  }

  get hasAsideAvatar(): boolean {
    return !!(this.imageUrl || this.iconName || this.lucideIcon);
  }

  get showAside(): boolean {
    return (
      this.hasAsideAvatar ||
      !!this.asideBadge?.trim() ||
      !!this.createdAtLabel?.trim()
    );
  }

  get badgeAsideOnly(): boolean {
    return !!this.asideBadge?.trim() && !this.hasAsideAvatar && !this.createdAtLabel?.trim();
  }

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
      void navigateAppForward(this.navController, this.router, tree);
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
