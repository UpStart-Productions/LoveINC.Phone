import type { PlatformPlan, PlatformPlanMoment } from '../services/platform/types';
import type { ContentPlan, ContentPlanMoment } from './content-plan.model';

export function mapPlatformPlanToContentPlan(
  plan: PlatformPlan,
  resolveUploadUrl: (path?: string) => string
): ContentPlan {
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    coverPhotoUrl: plan.coverPhotoUrl
      ? resolveUploadUrl(plan.coverPhotoUrl)
      : undefined,
    author: mapPlatformPlanAuthor(plan.author, resolveUploadUrl),
    displayStyle: plan.displayStyle,
    tags: mapPlatformPlanTags(plan.tags),
    moments: plan.moments.map((moment) => mapPlatformMoment(moment, resolveUploadUrl)),
  };
}

function mapPlatformPlanAuthor(
  author: PlatformPlan['author'] | undefined,
  resolveUploadUrl: (path?: string) => string
): ContentPlan['author'] {
  const name = author?.name?.trim() ?? '';
  const avatarRaw = author?.avatarUrl?.trim();
  return {
    name,
    avatarUrl: avatarRaw ? resolveUploadUrl(avatarRaw) : undefined,
  };
}

function mapPlatformPlanTags(tags: PlatformPlan['tags']): string[] | undefined {
  if (!tags?.length) {
    return undefined;
  }

  const normalized = tags
    .map((tag) => (tag.slug ?? tag.name ?? '').trim().toLowerCase())
    .filter(Boolean);

  return normalized.length ? normalized : undefined;
}

/** Plan cover photo, or the first moment photo block when no cover is set. */
export function resolvePlanCoverImageUrl(plan: ContentPlan): string | undefined {
  const cover = plan.coverPhotoUrl?.trim();
  if (cover) {
    return cover;
  }

  for (const moment of plan.moments) {
    for (const block of moment.blocks) {
      if (block.type !== 'PHOTO') continue;
      const url = block.content['url'];
      if (typeof url === 'string' && url.trim()) {
        return url.trim();
      }
    }
  }

  return undefined;
}

/** Plain text from a moment block matched by stable `blockId` (e.g. `subtitle`). */
export function resolveMomentBlockText(
  moment: ContentPlanMoment,
  blockId: string
): string | undefined {
  const block = moment.blocks.find((row) => row.blockId === blockId);
  if (!block) {
    return undefined;
  }

  const text = block.content['text'];
  if (typeof text === 'string' && text.trim()) {
    return text.trim();
  }

  const html = block.content['html'];
  if (typeof html === 'string' && html.trim()) {
    return html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return undefined;
}

function mapPlatformMoment(
  moment: PlatformPlanMoment,
  resolveUploadUrl: (path?: string) => string
): ContentPlanMoment {
  return {
    planMomentId: moment.planMomentId,
    order: moment.order,
    id: moment.id,
    title: moment.title,
    shared: moment.shared,
    blocks: moment.blocks.map((block) => ({
      ...block,
      content: resolveBlockContent(block.type, block.content, resolveUploadUrl),
    })),
  };
}

function resolveBlockContent(
  type: string,
  content: Record<string, unknown>,
  resolveUploadUrl: (path?: string) => string
): Record<string, unknown> {
  if (type !== 'PHOTO' && type !== 'DOCUMENT') {
    return content;
  }

  const url = typeof content['url'] === 'string' ? content['url'] : '';
  if (!url.trim()) {
    return content;
  }

  return {
    ...content,
    url: resolveUploadUrl(url),
  };
}
