import { format } from 'date-fns';
import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import type { PlatformPlan, PlatformPlanMoment, PlatformTheme } from '../services/platform/types';
import { formatDateRangeCompact } from '../shared/utils/date-time-formatting';
import { resolveAvatarBackgroundColor } from '../shared/utils/avatar-palette.util';
import { hasMeaningfulRichText } from './content-plan-author.util';
import type {
  ContentPlan,
  ContentPlanBlock,
  ContentPlanMoment,
  ContentPlanTheme,
} from './content-plan.model';

export interface MapContentPlanToListItemOptions {
  navigationFrom?: string;
  /** When false, omits per-row theme category (e.g. on the dedicated TfT list). */
  showThemeCategory?: boolean;
  /** When true, date sits on the author row (right-aligned) instead of the aside. */
  createdAtInlineWithAuthor?: boolean;
}

export function mapPlatformPlanToContentPlan(
  plan: PlatformPlan,
  resolveUploadUrl: (path?: string) => string
): ContentPlan {
  return {
    id: plan.id,
    slug: plan.slug,
    title: plan.title,
    order: typeof plan.order === 'number' ? plan.order : 0,
    coverPhotoUrl: plan.coverPhotoUrl
      ? resolveUploadUrl(plan.coverPhotoUrl)
      : undefined,
    author: mapPlatformPlanAuthor(plan.author, resolveUploadUrl),
    theme: mapPlatformPlanTheme(plan.theme),
    displayStyle: plan.displayStyle,
    createdAt: plan.createdAt?.trim() || undefined,
    moments: plan.moments
      .map((moment) => mapPlatformMoment(moment, resolveUploadUrl))
      .sort((a, b) => a.order - b.order),
  };
}

/** Display label for detail cards (e.g. "AUG 15, 2026"). */
export function formatContentPlanCreatedAtLabel(createdAt?: string): string | undefined {
  const raw = createdAt?.trim();
  if (!raw) {
    return undefined;
  }
  const label = formatDateRangeCompact(raw, raw);
  return label || undefined;
}

/** Short list-card date (e.g. "Jan 1") — no year, not all caps. */
export function formatContentPlanCreatedAtShortLabel(createdAt?: string): string | undefined {
  const raw = createdAt?.trim();
  if (!raw) {
    return undefined;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return format(date, 'MMM d');
}

/** Read Lucide icon name from GrovLink inline SVG markup (`data-icon` attribute). */
export function parseLucideIconNameFromIconSvg(iconSvg: string | undefined): string | undefined {
  if (!iconSvg?.trim()) {
    return undefined;
  }
  const match = iconSvg.match(/\bdata-icon="([a-z0-9-]+)"/);
  return match?.[1];
}

export function mapContentPlanThemeToLearnListItem(theme: ContentPlanTheme): ContentCardListItem {
  const subtitle = theme.subtitle?.trim();
  const iconSvg = theme.iconSvg?.trim();
  const lucideIcon = parseLucideIconNameFromIconSvg(iconSvg);

  return {
    id: theme.id,
    title: theme.name,
    category: subtitle || undefined,
    categoryIconSvg: iconSvg || undefined,
    lucideIcon,
    iconBackgroundColor: resolveAvatarBackgroundColor(theme.id),
    compactCategoryLabel: true,
    route: `/tabs/content-plan-theme/${theme.id}`,
    navigationFrom: 'tools',
  };
}

export function mapContentPlanToListItem(
  plan: ContentPlan,
  options: MapContentPlanToListItemOptions = {}
): ContentCardListItem {
  const navigationFrom = options.navigationFrom ?? 'home';
  const showThemeCategory = options.showThemeCategory ?? true;
  const author = plan.author.name?.trim();
  const subtitle = plan.moments[0]
    ? resolveMomentBlockText(plan.moments[0], 'subtitle')
    : undefined;
  const imageUrl = resolvePlanCoverImageUrl(plan);
  const themeSubtitle = plan.theme.subtitle?.trim();
  const themeIconSvg = plan.theme.iconSvg?.trim();

  return {
    id: plan.id,
    category: showThemeCategory
      ? themeSubtitle || plan.theme.name || 'Learning'
      : undefined,
    categoryIconSvg: showThemeCategory && themeIconSvg ? themeIconSvg : undefined,
    compactCategoryLabel: showThemeCategory,
    title: plan.title,
    detail: subtitle,
    authorName: author || undefined,
    authorAvatarUrl: plan.author.avatarUrl,
    authorTitle: plan.author.title,
    authorBio: hasMeaningfulRichText(plan.author.bio) ? plan.author.bio : undefined,
    createdAtLabel: formatContentPlanCreatedAtShortLabel(plan.createdAt),
    createdAtInlineWithAuthor: options.createdAtInlineWithAuthor ?? false,
    imageUrl,
    route: `/tabs/content-plan/${plan.id}`,
    navigationFrom,
  };
}

export function compareContentPlansByOrder(a: ContentPlan, b: ContentPlan): number {
  const orderDiff = a.order - b.order;
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
}

export function sortContentPlansByOrder(plans: ContentPlan[]): ContentPlan[] {
  return [...plans].sort(compareContentPlansByOrder);
}

/** Case-insensitive theme name match (trim + lowercase). */
export function normalizePlanThemeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapPlatformPlanTheme(theme: PlatformPlan['theme'] | undefined): ContentPlanTheme {
  return mapPlatformTheme(theme);
}

export function mapPlatformTheme(
  theme: PlatformPlan['theme'] | PlatformTheme | undefined | null
): ContentPlanTheme {
  const subtitle = theme?.subtitle?.trim();
  const iconSvg = theme?.iconSvg?.trim();

  return {
    id: theme?.id?.trim() ?? '',
    name: theme?.name?.trim() ?? '',
    subtitle: subtitle || undefined,
    iconSvg: iconSvg || undefined,
    isActive: theme?.isActive ?? false,
    showOnHome: theme?.showOnHome ?? false,
    displayStyle: theme?.displayStyle ?? 'COVER_CARDS',
  };
}

function mapPlatformPlanAuthor(
  author: PlatformPlan['author'] | undefined,
  resolveUploadUrl: (path?: string) => string
): ContentPlan['author'] {
  const raw = author;
  const nested = raw?.person;
  const name = raw?.name?.trim() ?? nested?.name?.trim() ?? '';
  const avatarRaw = raw?.avatarUrl?.trim() ?? nested?.photoUrl?.trim();
  const title = raw?.title?.trim() ?? nested?.title?.trim();
  const bioCandidate = raw?.bio ?? raw?.notes ?? nested?.bio ?? nested?.notes;
  const bio = hasMeaningfulRichText(bioCandidate) ? bioCandidate!.trim() : undefined;
  return {
    name,
    avatarUrl: avatarRaw ? resolveUploadUrl(avatarRaw) || avatarRaw : undefined,
    title: title || undefined,
    bio,
  };
}

/** First PHOTO block URL on a moment (by block order), when present. */
export function resolveMomentFirstPhotoUrl(moment: ContentPlanMoment): string | undefined {
  const blocks = [...moment.blocks].sort((a, b) => a.order - b.order);
  for (const block of blocks) {
    if (block.type !== 'PHOTO') {
      continue;
    }
    const url = block.content['url'];
    if (typeof url === 'string' && url.trim()) {
      return url.trim();
    }
  }
  return undefined;
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

function normalizeMomentBlockId(blockId: string): string {
  return blockId.trim().toLowerCase();
}

/** Find a moment block by stable `blockId` (case-insensitive), e.g. `subtitle`. */
export function findMomentBlock(
  blocks: ContentPlanBlock[],
  blockId: string
): ContentPlanBlock | undefined {
  const key = normalizeMomentBlockId(blockId);
  return blocks.find((row) => normalizeMomentBlockId(row.blockId) === key);
}

/** Title/subtitle blocks render above the main block list. */
export function isMomentMetaBlock(block: ContentPlanBlock): boolean {
  const id = normalizeMomentBlockId(block.blockId);
  return id === 'title' || id === 'subtitle';
}

/** HTML for displaying a block (Quill `html` or plain `text`). */
export function resolveBlockRichHtml(block: ContentPlanBlock | undefined): string | undefined {
  if (!block) {
    return undefined;
  }

  const html = block.content['html'];
  if (typeof html === 'string' && html.trim()) {
    return html.trim();
  }

  const text = block.content['text'];
  if (typeof text === 'string' && text.trim()) {
    const escaped = text
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<p>${escaped}</p>`;
  }

  return undefined;
}

/** Plain text from a moment block matched by stable `blockId` (e.g. `subtitle`). */
export function resolveMomentBlockText(
  moment: ContentPlanMoment,
  blockId: string
): string | undefined {
  const block = findMomentBlock(moment.blocks, blockId);
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
