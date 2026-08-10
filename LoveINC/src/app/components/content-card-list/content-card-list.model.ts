import type { ContentCardTextSegment } from '../content-card/content-card.component';

/** Row model for `app-content-card-list` — maps to `app-content-card` inputs. */
export interface ContentCardListItem {
  id?: string;
  title: string;
  category?: string;
  categoryIcon?: string;
  lucideCategoryIcon?: string;
  categoryExtra?: string;
  titleSegments?: ContentCardTextSegment[];
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
  compactDetail?: boolean;
  clickable?: boolean;
  /** Right-cell badge text (e.g. journal entry date). Shown with or without avatar. */
  asideBadge?: string;
  /** Ionic badge color for `asideBadge` (default `success`). */
  asideBadgeColor?: string;
  /** Ionicon overlay on photo avatar lower-left (e.g. `checkmark-circle`). */
  avatarOverlayIcon?: string;
  /** Ionic color for `avatarOverlayIcon` (default `success`). */
  avatarOverlayIconColor?: string;
}
