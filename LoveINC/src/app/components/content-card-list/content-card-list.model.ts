import type { ContentCardTextSegment } from '../content-card/content-card.component';

/** Row model for `app-content-card-list` — maps to `app-content-card` inputs. */
export interface ContentCardListItem {
  id?: string;
  title: string;
  category?: string;
  categoryIcon?: string;
  lucideCategoryIcon?: string;
  /** Inline Lucide SVG HTML for the category/eyebrow row. */
  categoryIconSvg?: string;
  categoryExtra?: string;
  titleSegments?: ContentCardTextSegment[];
  /** Lucide icon inline before the title. */
  lucideTitleIcon?: string;
  underTitle?: string;
  detail?: string;
  detailSegments?: ContentCardTextSegment[];
  imageUrl?: string;
  iconName?: string;
  lucideIcon?: string;
  iconBackgroundColor?: string;
  route?: string;
  navigationFrom?: string;
  preserveQueryParams?: boolean;
  tapUnderTitleToOpenMap?: boolean;
  mapPhone?: string;
  mapWebsite?: string;
  compactCategoryLabel?: boolean;
  clickable?: boolean;
  /** Right-cell badge text (e.g. journal entry date). Shown with or without avatar. */
  asideBadge?: string;
  /** Ionic badge color for `asideBadge` (default `success`). */
  asideBadgeColor?: string;
  /** Ionicon overlay on photo avatar lower-left (e.g. `checkmark-circle`). */
  avatarOverlayIcon?: string;
  /** Ionic color for `avatarOverlayIcon` (default `success`). */
  avatarOverlayIconColor?: string;
  /** Inline author row under title (avatar left of "By {name}"). */
  authorName?: string;
  authorAvatarUrl?: string;
  authorTitle?: string;
  /** Bio HTML — when set, author row opens the bio modal instead of navigating the card. */
  authorBio?: string;
  /** Creation date above the aside avatar, inline with the theme/category row (e.g. "Jan 1"). */
  createdAtLabel?: string;
  /** When true, shows `createdAtLabel` on the author row (right-aligned) instead of the aside. */
  createdAtInlineWithAuthor?: boolean;
  /** Right-aside avatar size. `large` is 40% bigger than `small`. */
  asideAvatarSize?: 'small' | 'large';
}
