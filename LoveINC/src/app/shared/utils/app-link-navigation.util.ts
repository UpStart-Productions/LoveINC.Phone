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
    default:
      return 'Related';
  }
}

/** Phase 2: theme and path only. Returns null for types handled in later phases. */
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
