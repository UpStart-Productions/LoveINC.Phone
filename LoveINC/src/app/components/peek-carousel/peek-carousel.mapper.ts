import type { ContentCardListItem } from '../content-card-list/content-card-list.model';
import type { ContentPlan } from '../../content-plan/content-plan.model';
import {
  formatContentPlanCreatedAtLabel,
  mapContentPlanToListItem,
  resolvePlanCoverImageUrl,
} from '../../content-plan/content-plan.mapper';
import type { PeekCarouselCoverItem, PeekCarouselListSlide, PeekCarouselMediaItem } from './peek-carousel.model';

const LIST_ROWS_PER_SLIDE = 2;

export function mapContentPlanToCoverItem(plan: ContentPlan): PeekCarouselCoverItem | null {
  const imageUrl = resolvePlanCoverImageUrl(plan);
  if (!imageUrl) {
    return null;
  }

  return {
    id: plan.id,
    title: plan.title,
    imageUrl,
    authorName: plan.author.name || 'Love INC',
    authorAvatarUrl: plan.author.avatarUrl,
  };
}

export function mapContentPlanToMediaItem(plan: ContentPlan): PeekCarouselMediaItem {
  const imageUrl = resolvePlanCoverImageUrl(plan);
  const author = plan.author.name?.trim();

  return {
    id: plan.id,
    title: plan.title,
    imageUrl,
    imageColor: '#349394',
    authorName: author || 'Love INC',
    authorAvatarUrl: plan.author.avatarUrl,
    date: formatContentPlanCreatedAtLabel(plan.createdAt),
  };
}

export function mapPlansToListSlides(
  plans: ContentPlan[],
  navigationFrom = 'home'
): PeekCarouselListSlide[] {
  const rows = plans.map((plan) =>
    mapContentPlanToListItem(plan, { navigationFrom, showThemeCategory: true })
  );
  if (!rows.length) {
    return [];
  }

  const slides: PeekCarouselListSlide[] = [];
  for (let index = 0; index < rows.length; index += LIST_ROWS_PER_SLIDE) {
    slides.push({
      id: `list-${index / LIST_ROWS_PER_SLIDE}`,
      rows: rows.slice(index, index + LIST_ROWS_PER_SLIDE),
    });
  }
  return slides;
}

export { mapContentPlanToListItem };
