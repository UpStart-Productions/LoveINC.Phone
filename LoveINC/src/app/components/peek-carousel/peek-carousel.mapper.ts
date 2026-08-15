import type { ContentCardListItem } from '../content-card-list/content-card-list.model';
import type { ContentPlan } from '../../content-plan/content-plan.model';
import { resolveMomentBlockText, resolvePlanCoverImageUrl } from '../../content-plan/content-plan.mapper';
import type { PeekCarouselCoverItem, PeekCarouselListSlide, PeekCarouselMediaItem } from './peek-carousel.model';

const LIST_ROWS_PER_SLIDE = 2;
const TFT_CATEGORY = 'Tools for Transformation';

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
  const subtitle = plan.moments[0]
    ? resolveMomentBlockText(plan.moments[0], 'subtitle')
    : undefined;

  return {
    id: plan.id,
    title: plan.title,
    description: subtitle,
    imageUrl,
    imageColor: '#349394',
    authorName: author || 'Love INC',
    authorAvatarUrl: plan.author.avatarUrl,
  };
}

export function mapContentPlanToListItem(
  plan: ContentPlan,
  navigationFrom = 'home'
): ContentCardListItem {
  const author = plan.author.name?.trim();
  const subtitle = plan.moments[0]
    ? resolveMomentBlockText(plan.moments[0], 'subtitle')
    : undefined;
  const imageUrl = resolvePlanCoverImageUrl(plan);

  return {
    id: plan.id,
    category: TFT_CATEGORY,
    lucideCategoryIcon: 'compass',
    compactCategoryLabel: true,
    title: plan.title,
    detail: subtitle,
    authorName: author || undefined,
    authorAvatarUrl: plan.author.avatarUrl,
    imageUrl,
    lucideIcon: imageUrl ? undefined : 'compass',
    iconBackgroundColor: '#349394',
    route: `/tabs/content-plan/${plan.id}`,
    navigationFrom,
  };
}

export function mapPlansToListSlides(
  plans: ContentPlan[],
  navigationFrom = 'home'
): PeekCarouselListSlide[] {
  const rows = plans.map((plan) => mapContentPlanToListItem(plan, navigationFrom));
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
