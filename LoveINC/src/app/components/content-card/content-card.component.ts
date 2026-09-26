import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { navigateAppForward } from '../../shared/utils/navigation-forward.util';
import { IonBadge, IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { LucideAngularModule } from 'lucide-angular';
import { LocationMapModalService } from '../../services/location-map-modal.service';
import { AuthorBioModalService } from '../../services/author-bio-modal.service';
import { hasMeaningfulRichText } from '../../content-plan/content-plan-author.util';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { MealStarRatingComponent } from '../../meal-planner-tabs/components/meal-star-rating/meal-star-rating.component';

/** Optional fragments for coloring numeric parts (e.g. budget amounts). */
export type ContentCardTextSegment = {
  text: string;
  tone?: 'positive' | 'negative';
};

export type ContentCardAsideAvatarSize = 'small' | 'large' | 'xl';

@Component({
  selector: 'app-content-card',
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonCard,
    IonCardContent,
    IonIcon,
    LucideAngularModule,
    SafeHtmlPipe,
    MealStarRatingComponent,
  ],
})
export class ContentCardComponent {
  private readonly navController = inject(NavController);
  private readonly authorBioModal = inject(AuthorBioModalService);
  /** Optional all-caps label above the title (e.g. "Instructor", "Contact"). */
  @Input() uppercaseLabel?: string;

  /** Small category label above title (e.g. "Guided Scripture", "Guided Prayer") */
  @Input() category?: string;

  /** Optional icon name for category line (e.g. "water-outline", "checkmark-done-outline") */
  @Input() categoryIcon?: string;

  /** Optional Lucide icon name for category line (e.g. "sprout") */
  @Input() lucideCategoryIcon?: string;

  /** Inline Lucide SVG HTML for category line (from GrovLink theme.iconSvg or Quill). */
  @Input() categoryIconSvg?: string;

  /** Optional extra text before category (e.g. "0", "Day 5") */
  @Input() categoryExtra?: string;

  /** Lucide icon inline before the title (e.g. graduation-cap for learning journal entries). */
  @Input() lucideTitleIcon?: string;

  /** Show a bookmark control on the title row (job cards). */
  @Input() saveToggle = false;

  /** Whether the bookmark is filled. */
  @Input() saved = false;

  /** Job benefit/type tags shown as pills. */
  @Input() tags?: string[];

  @Output() saveClick = new EventEmitter<void>();

  /** Main title (bold) */
  @Input() title!: string;

  /** When set, title is built from segments (e.g. colored amounts); overrides plain `title` display. */
  @Input() titleSegments?: ContentCardTextSegment[];

  /** Optional line between title and underTitle (e.g. tagline). */
  @Input() subtitle?: string;

  /** Optional line directly under the title (e.g. address), left column only */
  @Input() underTitle?: string;

  /** Detail text below title (e.g. "2-5 min", "4-6 min") */
  @Input() detail?: string;

  /** Meal recap star rating, shown at the far right of the detail row. */
  @Input() mealStarRating?: number;

  /** Clamp detail to one line (ellipsis if overflow). */
  @Input() detailSingleLine = false;

  /** When set, detail is built from segments; overrides plain `detail` display. */
  @Input() detailSegments?: ContentCardTextSegment[];

  /** Show play icon before detail when present */
  @Input() showDetailPlayIcon = true;

  /** Image URL for right-side visual. If set, icon/iconBg are ignored unless `imageOnMutedBackground`. */
  @Input() imageUrl?: string;

  /**
   * Sit the image on a grey rounded square (company logos). Default photo
   * avatars stay cover-fill with no extra tile.
   */
  @Input() imageOnMutedBackground = false;

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

  /**
   * Tool promo layout: eyebrow + title left, icon right on one row; detail full-width below.
   * When unset, auto-applies for compact promo cards (home tools, Learn GrovPods).
   */
  @Input() toolHeaderLayout?: boolean;

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

  @Input() authorTitle?: string;

  /** Bio HTML — when set, tapping the author row opens the bio modal. */
  @Input() authorBio?: string;

  /** Creation date above the aside avatar, inline with the theme/category row (e.g. "Jan 1"). */
  @Input() createdAtLabel?: string;

  /** Render `createdAtLabel` as bold red text (stale saved job). */
  @Input() createdAtLabelDanger = false;

  /** When true, shows `createdAtLabel` on the author row (right-aligned) instead of the aside. */
  @Input() createdAtInlineWithAuthor = false;

  /** Right-aside avatar size. Each step is 40% bigger than the previous (`large`, `xl`). */
  @Input() asideAvatarSize: ContentCardAsideAvatarSize = 'small';

  get asideLucideIconSize(): number {
    switch (this.asideAvatarSize) {
      case 'xl':
        return 48;
      case 'large':
        return 34;
      default:
        return 24;
    }
  }

  get hasAsideAvatar(): boolean {
    return !!(this.imageUrl || this.iconName || this.lucideIcon);
  }

  get toolHeaderLayoutActive(): boolean {
    if (this.toolHeaderLayout === true) {
      return true;
    }
    if (this.toolHeaderLayout === false) {
      return false;
    }
    return (
      this.compactCategoryLabel &&
      this.hasAsideAvatar &&
      !this.listRow &&
      !this.saveToggle &&
      !this.authorName?.trim() &&
      !this.asideBadge?.trim() &&
      !this.showAsideDate &&
      !this.uppercaseLabel?.trim()
    );
  }

  get showAside(): boolean {
    const asideDate = !!this.createdAtLabel?.trim() && !this.createdAtInlineWithAuthor;
    return this.hasAsideAvatar || !!this.asideBadge?.trim() || asideDate;
  }

  get hasInlineDetailRating(): boolean {
    return this.listRow && this.mealStarRating != null && !!this.detail;
  }

  get hasAsideDetailRating(): boolean {
    return !this.listRow && this.mealStarRating != null && !!this.detail;
  }

  get badgeAsideOnly(): boolean {
    return !!this.asideBadge?.trim() && !this.hasAsideAvatar && !this.createdAtLabel?.trim();
  }

  get showAsideDate(): boolean {
    return !!this.createdAtLabel?.trim() && !this.createdAtInlineWithAuthor;
  }

  get showAuthorDate(): boolean {
    return !!this.createdAtLabel?.trim() && this.createdAtInlineWithAuthor;
  }

  get hasAuthorBio(): boolean {
    return hasMeaningfulRichText(this.authorBio);
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

  onSaveTap(event: Event): void {
    event.stopPropagation();
    this.saveClick.emit();
  }

  onAuthorTap(event: Event): void {
    event.stopPropagation();
    if (!this.hasAuthorBio || !this.authorName?.trim()) {
      return;
    }

    void this.authorBioModal.open({
      name: this.authorName,
      jobTitle: this.authorTitle,
      notes: this.authorBio,
      photoUrl: this.authorAvatarUrl,
    });
  }
}
