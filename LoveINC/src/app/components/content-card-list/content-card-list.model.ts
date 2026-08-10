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
}
