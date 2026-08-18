import type { ContentPlanThemeDisplayStyle } from './content-plan.model';
import type { PeekCarouselVariant } from '../components/peek-carousel/peek-carousel.model';

/** Map GrovLink theme display to peek-carousel layout variant. */
export function mapThemeDisplayToPeekVariant(
  displayStyle: ContentPlanThemeDisplayStyle | undefined | null
): PeekCarouselVariant {
  switch (displayStyle) {
    case 'DETAIL_CARDS':
      return 'media';
    case 'LIST':
      return 'list';
    case 'COVER_CARDS':
    default:
      return 'cover';
  }
}
