import type { PlatformCta, PlatformCtaType } from '../../services/platform/types';
import type { PeekCarouselMediaItem } from '../peek-carousel/peek-carousel.model';
import {
  formatDateRangeCompact,
  formatEventDatesCompact,
  formatTimeStringCompact,
} from '../../shared/utils';
import type { HomeCtaRowModel } from './home-cta-row.model';

function platformCtaSubtitle(cta: PlatformCta): string {
  if (cta.events?.length === 1) {
    const e = cta.events[0];
    return formatEventDatesCompact(e.startDate, e.endDate);
  }
  if (cta.class?.nextSession) {
    const ns = cta.class.nextSession;
    return ns.time
      ? `${ns.dayOfWeek} ${formatTimeStringCompact(ns.time)}`
      : formatDateRangeCompact(ns.startDate, ns.endDate);
  }
  if (cta.providerOffering?.provider?.name) {
    return cta.providerOffering.provider.name;
  }
  if (cta.donation?.provider?.name) {
    return cta.donation.provider.name;
  }
  if (cta.volunteerPositions?.length === 1 && cta.volunteerPositions[0].affiliate) {
    return cta.volunteerPositions[0].affiliate;
  }
  return '';
}

function platformCtaIconName(type: PlatformCtaType, context: 'give' | 'volunteer'): string {
  if (context === 'volunteer') return 'heart-outline';
  switch (type) {
    case 'awareness':
      return 'megaphone-outline';
    case 'fundraiser':
      return 'ribbon-outline';
    default:
      return 'gift-outline';
  }
}

function platformCtaPillText(type: PlatformCtaType, context: 'give' | 'volunteer'): string {
  if (context === 'volunteer') return 'Serve';
  switch (type) {
    case 'awareness':
      return 'News';
    case 'fundraiser':
      return 'Fundraiser';
    case 'donation_drive':
    default:
      return 'Donate';
  }
}

function platformCtaAccentColor(type: PlatformCtaType, context: 'give' | 'volunteer'): string {
  if (context === 'volunteer') return 'var(--love-inc-teal)';
  switch (type) {
    case 'awareness':
      return '#6366f1';
    case 'fundraiser':
      return '#e11d48';
    default:
      return 'var(--love-inc-gold)';
  }
}

function platformContentDetailType(type: PlatformCtaType): string {
  const map: Record<PlatformCtaType, string> = {
    donation_drive: 'donation-drive',
    volunteer_call: 'volunteer',
    fundraiser: 'fundraiser',
    awareness: 'awareness',
  };
  return map[type] ?? type;
}

export function mapPlatformCtaToRow(
  cta: PlatformCta,
  context: 'give' | 'volunteer'
): HomeCtaRowModel {
  const accent = platformCtaAccentColor(cta.type, context);
  const progress =
    cta.goalValue != null && cta.goalValue > 0 && cta.currentValue != null
      ? {
          current: cta.currentValue,
          goal: cta.goalValue,
          unitLabel: cta.unitLabel,
        }
      : undefined;

  return {
    id: cta.id,
    body: cta.title,
    subtitle: platformCtaSubtitle(cta) || undefined,
    photoUrl: cta.photoUrl,
    iconName: cta.photoUrl ? undefined : platformCtaIconName(cta.type, context),
    iconColor: accent,
    pillText: platformCtaPillText(cta.type, context),
    pillColor: accent,
    progress,
    action: {
      kind: 'content-detail',
      contentType: platformContentDetailType(cta.type),
      id: cta.id,
    },
  };
}

export function buildConnectionCenterCtaRow(): HomeCtaRowModel {
  return {
    id: 'connection-center',
    body: 'Access services through our Connection Center',
    iconName: 'people-circle-outline',
    iconColor: 'var(--love-inc-blue)',
    pillText: 'Start',
    pillColor: 'var(--love-inc-blue)',
    action: {
      kind: 'route',
      path: ['/tabs/connection-center'],
      queryParams: { from: 'home' },
    },
  };
}

export function buildGetHelpCtaRow(
  description: string,
  action: 'profile' | 'gap-ministries' | 'connection-center'
): HomeCtaRowModel {
  return {
    id: 'get-help',
    body: description,
    iconName: 'people-circle-outline',
    iconColor: 'var(--love-inc-blue)',
    pillText: 'Start',
    pillColor: 'var(--love-inc-blue)',
    action: { kind: 'get-help', target: action },
  };
}

export function buildGiveNowCtaRow(): HomeCtaRowModel {
  return {
    id: 'give-now',
    body: 'Give to Love INC Newberg',
    iconName: 'gift-outline',
    iconColor: 'var(--love-inc-gold)',
    pillText: 'Donate',
    pillColor: 'var(--love-inc-gold)',
    action: { kind: 'donate-sheet' },
  };
}

export function buildVolunteerCtaRow(): HomeCtaRowModel {
  return {
    id: 'volunteer',
    body: 'Volunteer with Love INC',
    iconName: 'heart-outline',
    iconColor: 'var(--love-inc-teal)',
    pillText: 'Serve',
    pillColor: 'var(--love-inc-teal)',
    action: { kind: 'route', path: ['/tabs/volunteer-positions'], queryParams: { from: 'home' } },
  };
}

function formatHomeCtaDetail(row: HomeCtaRowModel): string | undefined {
  let detail = row.subtitle;
  if (row.progress?.goal != null && row.progress.current != null) {
    const unit = row.progress.unitLabel?.trim() ? ` ${row.progress.unitLabel.trim()}` : '';
    const progressLine = `${row.progress.current}/${row.progress.goal}${unit}`;
    detail = detail ? `${detail} · ${progressLine}` : progressLine;
  }
  return detail;
}

/** Media peek slides for platform CTAs (image on top, title + detail below). */
export function mapHomeCtaRowToMediaItem(row: HomeCtaRowModel): PeekCarouselMediaItem {
  const hideLabel = row.pillText === 'Serve' || row.pillText === 'News';

  return {
    id: row.id,
    title: row.body,
    description: formatHomeCtaDetail(row),
    imageUrl: row.photoUrl,
    imageColor: row.iconColor,
    date: hideLabel ? undefined : row.pillText,
  };
}

export function mapHomeCtaRowsToMediaItems(rows: HomeCtaRowModel[]): PeekCarouselMediaItem[] {
  return rows.map(mapHomeCtaRowToMediaItem);
}
