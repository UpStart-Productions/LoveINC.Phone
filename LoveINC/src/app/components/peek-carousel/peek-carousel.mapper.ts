import type { ContentPlan } from '../../content-plan/content-plan.model';
import { resolvePlanCoverImageUrl } from '../../content-plan/content-plan.mapper';
import type { PeekCarouselCoverItem } from './peek-carousel.model';

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
