import type { ContentCardListItem } from '../components/content-card-list/content-card-list.model';
import { parseLucideIconNameFromIconSvg } from '../content-plan/content-plan.mapper';
import { REGISTERED_TOOL_CARDS, resolveRegisteredToolTabRoute } from '../registered-tools';
import type {
  PlatformServiceCollectionDetail,
  PlatformServiceCollectionMember,
} from '../services/platform/types';
import { resolveAvatarBackgroundColor } from '../shared/utils/avatar-palette.util';

function toolCardForSlug(slug: string | undefined) {
  const normalized = slug?.trim();
  if (!normalized) return undefined;
  return REGISTERED_TOOL_CARDS.find((card) => card.route === `/tabs/${normalized}`);
}

export function mapCollectionMembersToListItems(
  collection: PlatformServiceCollectionDetail,
  resolveUploadUrl: (path?: string) => string,
): ContentCardListItem[] {
  const navigationFrom = 'collection';
  return collection.members
    .map((member) => mapCollectionMemberToListItem(collection, member, resolveUploadUrl, navigationFrom))
    .filter((item): item is ContentCardListItem => item != null);
}

function mapCollectionMemberToListItem(
  collection: PlatformServiceCollectionDetail,
  member: PlatformServiceCollectionMember,
  resolveUploadUrl: (path?: string) => string,
  navigationFrom: string,
): ContentCardListItem | null {
  const detail = member.shortDescription?.trim() || undefined;
  const photoUrl = member.photoUrl
    ? resolveUploadUrl(member.photoUrl) || member.photoUrl
    : undefined;

  switch (collection.contentType) {
    case 'service':
      return {
        id: member.id,
        title: member.title,
        detail,
        imageUrl: photoUrl,
        iconName: photoUrl ? undefined : 'people-outline',
        route: `/tabs/content-detail/gap-ministry/${member.id}`,
        navigationFrom,
      };
    case 'impact_story':
      return {
        id: member.id,
        title: member.title,
        detail,
        imageUrl: photoUrl,
        route: `/tabs/content-detail/impact-story/${member.id}`,
        navigationFrom,
      };
    case 'grov_seed': {
      const route = resolveRegisteredToolTabRoute(member.slug);
      if (!route) return null;
      const card = toolCardForSlug(member.slug);
      return {
        id: member.id,
        title: member.title,
        detail: detail ?? card?.detail,
        category: card?.category,
        lucideCategoryIcon: card?.lucideCategoryIcon,
        lucideIcon: card?.lucideIcon,
        iconBackgroundColor: card?.iconBackgroundColor ?? resolveAvatarBackgroundColor(member.id),
        route,
        navigationFrom,
      };
    }
    case 'theme': {
      const iconSvg = member.iconSvg?.trim();
      return {
        id: member.id,
        title: member.title,
        category: detail,
        categoryIconSvg: iconSvg || undefined,
        lucideIcon: parseLucideIconNameFromIconSvg(iconSvg),
        iconBackgroundColor: resolveAvatarBackgroundColor(member.id),
        compactCategoryLabel: true,
        route: `/tabs/content-plan-theme/${member.id}`,
        navigationFrom,
      };
    }
    case 'plan':
      return {
        id: member.id,
        title: member.title,
        detail,
        imageUrl: photoUrl,
        route: `/tabs/content-plan/${member.id}`,
        navigationFrom,
      };
    default:
      return null;
  }
}
