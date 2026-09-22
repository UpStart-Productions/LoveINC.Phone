import { resolveRegisteredToolTabRoute } from '../../registered-tools';
import type { PlatformAppLink } from '../../services/platform/types';

export function appLinkCategoryLabel(link: PlatformAppLink): string {
  switch (link.type) {
    case 'microlearning_theme':
      return 'Learning theme';
    case 'microlearning_plan':
      return 'Learning path';
    case 'grov_pod':
      return 'GrovPod';
    case 'collection':
      return 'Collection';
    case 'event':
      return 'Event';
    case 'class':
      return 'Class';
    case 'impact_story':
      return 'Impact story';
    default:
      return 'Related';
  }
}

export function resolveAppLinkNavigation(
  link: PlatformAppLink,
  from: string,
): { commands: string[]; queryParams?: Record<string, string> } | null {
  switch (link.type) {
    case 'microlearning_theme':
      return {
        commands: ['/tabs/content-plan-theme', link.id],
        queryParams: { from },
      };
    case 'microlearning_plan':
      return {
        commands: ['/tabs/content-plan', link.id],
        queryParams: { from },
      };
    case 'grov_pod': {
      const tabRoute = resolveRegisteredToolTabRoute(link.slug);
      if (!tabRoute) return null;
      return {
        commands: [tabRoute],
        queryParams: { from },
      };
    }
    case 'collection':
      if (link.collectionContentType === 'theme') {
        return {
          commands: ['/tabs/content-plan-theme', link.id],
          queryParams: { from },
        };
      }
      return {
        commands: ['/tabs/collection', link.id],
        queryParams: { from },
      };
    case 'event':
      return {
        commands: ['/tabs/content-detail/event', link.id],
        queryParams: { from },
      };
    case 'class':
      return {
        commands: ['/tabs/content-detail/class', link.id],
        queryParams: { from },
      };
    case 'impact_story':
      return {
        commands: ['/tabs/content-detail/impact-story', link.id],
        queryParams: { from },
      };
    default:
      return null;
  }
}

export function filterNavigableAppLinks(links: PlatformAppLink[] | undefined): PlatformAppLink[] {
  return (links ?? []).filter((link) => resolveAppLinkNavigation(link, 'home') != null);
}

export function relatedLinkFromForContentType(
  contentType: string,
): string {
  switch (contentType) {
    case 'event':
      return 'updates';
    case 'class':
      return 'transformation-classes';
    case 'impact-story':
      return 'impact-stories';
    default:
      return 'home';
  }
}
