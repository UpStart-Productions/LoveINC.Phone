import type { ContentCardListItem } from '../content-card-list/content-card-list.model';

/** Slide layout used by `app-peek-carousel`. */
export type PeekCarouselVariant = 'cover' | 'media' | 'list';

/** Hero slide: fixed-size card with background visual and overlay text. */
export interface PeekCarouselCoverItem {
  id: string;
  title: string;
  subtitle?: string;
  /** Remote image URL. When omitted, `imageColor` fills the card. */
  imageUrl?: string;
  /** Placeholder / mock fill when no `imageUrl`. */
  imageColor?: string;
}

/** Taller slide: visual on top, title/date/description below. */
export interface PeekCarouselMediaItem {
  id: string;
  title: string;
  date?: string;
  description?: string;
  imageUrl?: string;
  imageColor?: string;
}

/** One carousel slide containing a vertical stack of list rows. */
export interface PeekCarouselListSlide {
  id: string;
  rows: ContentCardListItem[];
}

export type PeekCarouselSlideClick =
  | { variant: 'cover'; item: PeekCarouselCoverItem }
  | { variant: 'media'; item: PeekCarouselMediaItem }
  | { variant: 'list'; slide: PeekCarouselListSlide };
