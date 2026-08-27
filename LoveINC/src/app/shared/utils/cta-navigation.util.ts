import type { PlatformCta } from '../../services/platform/types';
import type { HomeCtaAction } from '../../components/home-cta-row/home-cta-row.model';

export type CtaDestinationNavigation =
  | { kind: 'route'; path: string[]; queryParams?: Record<string, string> }
  | { kind: 'donate-sheet' };

/** Maps platform destination keys to Love INC routes. */
export function resolveCtaDestinationNavigation(
  destinationKey: string
): CtaDestinationNavigation | null {
  switch (destinationKey) {
    case 'classes':
    case 'programs':
      return {
        kind: 'route',
        path: ['/tabs/transformation-classes'],
        queryParams: { from: 'home' },
      };
    case 'events':
      return {
        kind: 'route',
        path: ['/tabs/updates'],
        queryParams: { from: 'home' },
      };
    case 'volunteer':
    case 'volunteer-positions':
      return {
        kind: 'route',
        path: ['/tabs/volunteer-positions'],
        queryParams: { from: 'home' },
      };
    case 'services':
      return {
        kind: 'route',
        path: ['/tabs/services'],
        queryParams: { from: 'home' },
      };
    case 'donate':
      return { kind: 'donate-sheet' };
    default:
      return null;
  }
}

export function resolvePlatformCtaSpecificRedirect(
  cta: PlatformCta
): { commands: string[]; queryParams?: Record<string, string> } | null {
  if (cta.volunteerPositions?.length === 1) {
    return {
      commands: ['/tabs/content-detail', 'volunteer-position', cta.volunteerPositions[0].id],
      queryParams: { from: 'home' },
    };
  }
  if (cta.events?.length === 1) {
    return {
      commands: ['/tabs/content-detail', 'event', cta.events[0].id],
      queryParams: { from: 'home' },
    };
  }
  if (cta.class?.id) {
    return {
      commands: ['/tabs/content-detail', 'class', cta.class.id],
      queryParams: { from: 'home' },
    };
  }
  if (cta.impactStory?.id) {
    return {
      commands: ['/tabs/content-detail', 'impact-story', cta.impactStory.id],
      queryParams: { from: 'home' },
    };
  }
  if (cta.providerOffering?.id) {
    return {
      commands: ['/tabs/content-detail', 'gap-ministry', cta.providerOffering.id],
      queryParams: { from: 'home' },
    };
  }
  if (cta.service?.id) {
    return {
      commands: ['/tabs/content-detail', 'gap-ministry', cta.service.id],
      queryParams: { from: 'home' },
    };
  }
  if (
    cta.donation?.id &&
    (cta.type === 'donation_drive' || cta.type === 'fundraiser')
  ) {
    return {
      commands: ['/tabs/donate-goods'],
      queryParams: { donationId: cta.donation.id, from: 'home' },
    };
  }
  return null;
}

export function resolvePlatformCtaBrowseRedirect(
  cta: PlatformCta
):
  | { commands: string[]; queryParams?: Record<string, string> }
  | { kind: 'donate-sheet' }
  | null {
  if (cta.actionType !== 'openDestination' || !cta.actionValue) {
    return null;
  }
  const dest = resolveCtaDestinationNavigation(cta.actionValue);
  if (!dest) {
    return null;
  }
  if (dest.kind === 'donate-sheet') {
    return { kind: 'donate-sheet' };
  }
  return { commands: dest.path, queryParams: dest.queryParams };
}

export function resolvePlatformCtaRedirect(
  cta: PlatformCta
):
  | { commands: string[]; queryParams?: Record<string, string> }
  | { kind: 'donate-sheet' }
  | null {
  const browse = resolvePlatformCtaBrowseRedirect(cta);
  if (browse) {
    return browse;
  }
  return resolvePlatformCtaSpecificRedirect(cta);
}

export function resolvePlatformCtaHomeAction(cta: PlatformCta): HomeCtaAction {
  if (cta.actionType === 'openDestination' && cta.actionValue) {
    const dest = resolveCtaDestinationNavigation(cta.actionValue);
    if (dest?.kind === 'route') {
      return {
        kind: 'route',
        path: dest.path,
        queryParams: dest.queryParams,
      };
    }
    if (dest?.kind === 'donate-sheet') {
      return { kind: 'donate-sheet' };
    }
  }

  const specific = resolvePlatformCtaSpecificRedirect(cta);
  if (specific) {
    return {
      kind: 'route',
      path: specific.commands,
      queryParams: specific.queryParams,
    };
  }

  return {
    kind: 'content-detail',
    contentType: platformContentDetailType(cta.type),
    id: cta.id,
  };
}

function platformContentDetailType(type: PlatformCta['type']): string {
  const map: Record<PlatformCta['type'], string> = {
    donation_drive: 'donation-drive',
    volunteer_call: 'volunteer',
    fundraiser: 'fundraiser',
    awareness: 'awareness',
  };
  return map[type] ?? type;
}
