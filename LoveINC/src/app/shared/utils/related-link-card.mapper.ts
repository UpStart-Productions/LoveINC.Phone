import type { ContentCardListItem } from '../../components/content-card-list/content-card-list.model';
import { parseLucideIconNameFromIconSvg } from '../../content-plan/content-plan.mapper';
import { REGISTERED_TOOL_CARDS } from '../../registered-tools';
import type { PlatformAppLink } from '../../services/platform/types';
import { resolveAvatarBackgroundColor } from './avatar-palette.util';
import {
  relatedLinkFromForContentType,
  resolveAppLinkNavigation,
} from './app-link-navigation.util';

function commandsToRoute(commands: readonly string[]): string | undefined {
  if (commands.length === 0) return undefined;
  if (commands.length === 1) return commands[0];
  const [base, ...rest] = commands;
  return [base, ...rest.filter(Boolean)].join('/');
}

function toolCardForSlug(slug: string | undefined) {
  const normalized = slug?.trim();
  if (!normalized) return undefined;
  return REGISTERED_TOOL_CARDS.find((card) => card.route === `/tabs/${normalized}`);
}

function resolveGrovPodLucideIcon(link: PlatformAppLink): string | undefined {
  const fromApi = link.lucideIcon?.trim();
  if (fromApi) return fromApi;
  return toolCardForSlug(link.slug)?.lucideIcon;
}

function resolveGrovPodIconBackground(link: PlatformAppLink): string {
  return toolCardForSlug(link.slug)?.iconBackgroundColor ?? resolveAvatarBackgroundColor(link.id);
}

export function mapRelatedLinkToListItem(
  link: PlatformAppLink,
  contentType: string,
  resolveUploadUrl: (path?: string) => string,
): ContentCardListItem | null {
  const from = relatedLinkFromForContentType(contentType);
  const target = resolveAppLinkNavigation(link, from);
  if (!target) return null;

  const route = commandsToRoute(target.commands);
  if (!route) return null;

  const subtitle = link.subtitle?.trim() || undefined;
  const photoUrl = link.photoUrl
    ? resolveUploadUrl(link.photoUrl) || link.photoUrl
    : undefined;

  const base: ContentCardListItem = {
    id: `${link.type}-${link.id}`,
    title: link.title,
    detail: subtitle,
    route,
    navigationFrom: from,
    asideAvatarSize: 'large',
  };

  switch (link.type) {
    case 'microlearning_theme': {
      const iconSvg = link.iconSvg?.trim();
      const lucideIcon = parseLucideIconNameFromIconSvg(iconSvg);
      return {
        ...base,
        lucideIcon,
        iconBackgroundColor: resolveAvatarBackgroundColor(link.id),
      };
    }
    case 'microlearning_plan':
      return {
        ...base,
        imageUrl: photoUrl,
        iconName: photoUrl ? undefined : 'book-outline',
        iconBackgroundColor: resolveAvatarBackgroundColor(link.id),
      };
    case 'grov_pod':
      return {
        ...base,
        lucideIcon: resolveGrovPodLucideIcon(link),
        iconBackgroundColor: resolveGrovPodIconBackground(link),
      };
    case 'collection':
      if (link.collectionContentType === 'theme') {
        const iconSvg = link.iconSvg?.trim();
        return {
          ...base,
          lucideIcon: parseLucideIconNameFromIconSvg(iconSvg),
          iconBackgroundColor: resolveAvatarBackgroundColor(link.id),
        };
      }
      return {
        ...base,
        imageUrl: photoUrl,
        iconName: photoUrl ? undefined : 'layers-outline',
        iconBackgroundColor: resolveAvatarBackgroundColor(link.id),
      };
    default:
      return null;
  }
}

export function mapRelatedLinksToListItems(
  links: PlatformAppLink[] | undefined,
  contentType: string,
  resolveUploadUrl: (path?: string) => string,
): ContentCardListItem[] {
  return (links ?? [])
    .map((link) => mapRelatedLinkToListItem(link, contentType, resolveUploadUrl))
    .filter((item): item is ContentCardListItem => item != null);
}
