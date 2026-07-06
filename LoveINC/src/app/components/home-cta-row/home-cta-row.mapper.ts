import type { PlatformCta, PlatformCtaType } from '../../services/platform/types';
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

export function buildGetHelpCtaRow(
  description: string,
  intakeConnectionLink: boolean,
  action: 'profile' | 'gap-ministries' | 'assistance-intro'
): HomeCtaRowModel {
  return {
    id: 'get-help',
    body: description,
    bodyMode: intakeConnectionLink ? 'intake-connection' : 'plain',
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
