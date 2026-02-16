import { Injectable } from '@angular/core';
import { format, parse, addDays } from 'date-fns';
import {
  CardType,
  CardTypeLabels,
  CardTypeIcons,
  CardTypeColors,
} from '../models/home-card.model';
import { PlatformApiService } from './platform/platform-api.service';
import type {
  PlatformClass,
  PlatformCta,
  PlatformEvent,
  PlatformHomeFeedItem,
  PlatformImpactStory,
  PlatformOffering,
  PlatformService,
} from './platform/types';

export interface FormattedCard {
  id: string;
  type: CardType;
  title: string;
  subtitle: string;
  description: string;
  photoUrl: string;
  badge: { icon: string; label: string; color: string };
}

type CardApiItem =
  | PlatformEvent
  | PlatformClass
  | PlatformService
  | PlatformImpactStory
  | PlatformCta
  | PlatformHomeFeedItem;

@Injectable({ providedIn: 'root' })
export class CardFormattingService {
  constructor(private platformApi: PlatformApiService) {}

  formatForCard(item: CardApiItem, contentType: CardType): FormattedCard {
    const resolveUrl = (path: string | undefined) =>
      path ? this.platformApi.resolveUploadUrl(path) || path : '';

    const badge = {
      icon: CardTypeIcons[contentType] ?? 'ellipse-outline',
      label: CardTypeLabels[contentType] ?? contentType,
      color: CardTypeColors[contentType] ?? '#666',
    };

    const subtitle = this.formatSubtitle(item, contentType);
    const description = this.formatDescription(item);
    const title = this.getTitle(item);
    const photoUrl = resolveUrl(this.getPhotoUrl(item));

    return {
      id: this.getId(item),
      type: contentType,
      title,
      subtitle,
      description,
      photoUrl,
      badge,
    };
  }

  private getId(item: CardApiItem): string {
    return (item as { id: string }).id;
  }

  private getTitle(item: CardApiItem): string {
    return (item as { title: string }).title ?? '';
  }

  private getPhotoUrl(item: CardApiItem): string | undefined {
    return (item as { photoUrl?: string }).photoUrl;
  }

  private formatDescription(item: CardApiItem): string {
    const i = item as { shortDescription?: string; longDescription?: string };
    return i.shortDescription ?? i.longDescription ?? '';
  }

  private formatSubtitle(item: CardApiItem, contentType: CardType): string {
    switch (contentType) {
      case 'event':
        return this.formatEventSubtitle(item as PlatformEvent | PlatformHomeFeedItem);
      case 'class':
        return this.formatClassSubtitle(item as PlatformClass | PlatformHomeFeedItem);
      case 'impact':
        return ''; // Never use shortDescription in subtitle
      default:
        return this.formatGenericSubtitle(item);
    }
  }

  private formatEventSubtitle(item: PlatformEvent | PlatformHomeFeedItem): string {
    const startDate = (item as PlatformEvent).startDate ?? (item as PlatformHomeFeedItem).startDate;
    const endDate = (item as PlatformEvent).endDate ?? (item as PlatformHomeFeedItem).endDate;
    if (startDate || endDate) {
      return this.formatEventDates(startDate, endDate);
    }
    return (item as PlatformHomeFeedItem).subtitle ?? '';
  }

  private formatClassSubtitle(item: PlatformClass | PlatformHomeFeedItem): string {
    const platformClass = item as PlatformClass;
    const homeItem = item as PlatformHomeFeedItem;

    // PlatformClass: nextSession or offerings
    if (platformClass.nextSession) {
      return this.formatClassSessionSubtitle(platformClass.nextSession);
    }
    if (platformClass.offerings?.length) {
      const derived = this.deriveNextSessionFromOfferings(platformClass.offerings);
      if (derived) return this.formatClassSessionSubtitle(derived);
    }

    // PlatformHomeFeedItem: startDate/endDate or instructor
    if (homeItem.startDate || homeItem.endDate) {
      return this.formatEventDates(homeItem.startDate, homeItem.endDate);
    }
    if (homeItem.instructor) {
      return `Instructor: ${homeItem.instructor}`;
    }

    return homeItem.subtitle ?? '';
  }

  private formatClassSessionSubtitle(session: {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  }): string {
    const dateRange = this.formatSessionDateRange(session.startDate, session.endDate);
    const time12hr = this.formatTimeTo12hr(session.time);
    const dayAbbr = this.dayTo2Letter(session.dayOfWeek);
    return time12hr ? `${dayAbbr} ${time12hr}\n${dateRange}` : dateRange;
  }

  private dayTo2Letter(day: string): string {
    return day
      .split(',')
      .map((d) => d.trim().replace(/s$/, '').slice(0, 2))
      .filter(Boolean)
      .join(', ');
  }

  /** Convert 24hr time string (e.g. "18:00 - 20:00") to 12hr (e.g. "6:00 – 8:00 PM") */
  private formatTimeTo12hr(timeStr: string): string {
    if (!timeStr?.trim()) return timeStr;
    const ref = new Date(2000, 0, 1);
    const parts = timeStr.split(/\s*[-–]\s*|\s+to\s+/i).map((s) => s.trim()).filter(Boolean);
    const formatted = parts.map((part) => {
      try {
        const d = parse(part, 'HH:mm', ref);
        return format(d, 'h:mm a');
      } catch {
        try {
          const d = parse(part, 'HH:mm:ss', ref);
          return format(d, 'h:mm a');
        } catch {
          return part;
        }
      }
    });
    if (formatted.length >= 2) {
      const last = formatted[formatted.length - 1];
      const periodMatch = last.match(/\s(AM|PM)$/);
      if (periodMatch) {
        const period = periodMatch[1];
        const allSame = formatted.every((f) => f.endsWith(` ${period}`));
        if (allSame) {
          return formatted
            .map((f, i) => (i < formatted.length - 1 ? f.replace(/\s(AM|PM)$/, '') : f))
            .join(' – ');
        }
      }
    }
    return formatted.join(' – ');
  }

  private deriveNextSessionFromOfferings(offerings: PlatformOffering[]): {
    startDate: string;
    endDate: string;
    dayOfWeek: string;
    time: string;
  } | null {
    if (!offerings.length) return null;
    const offering = offerings[0];
    const rule = offering.scheduleRule;
    const sessions = offering.sessions?.filter((s) => !s.isCancelled);
    const session = sessions?.[0];
    if (!rule && !session) return null;
    const startDate = session?.startDate ?? rule?.startDate;
    const endDate = session?.endDate ?? rule?.endDate;
    if (!startDate || !endDate) return null;
    const dayOfWeek =
      rule?.daysOfWeek?.length
        ? rule.daysOfWeek.map((n) => this.dayNumberToName(n)).join(', ')
        : '';
    const rawTime = [rule?.startTime, rule?.endTime].filter(Boolean).join(' – ') || '';
    const time = this.formatTimeTo12hr(rawTime) || rawTime;
    return { startDate, endDate, dayOfWeek, time };
  }

  private dayNumberToName(n: number): string {
    const sun = new Date(2024, 0, 7);
    return format(addDays(sun, n), 'EEE').slice(0, 2);
  }

  private formatSessionDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }

  private formatGenericSubtitle(item: CardApiItem): string {
    const homeItem = item as PlatformHomeFeedItem;
    return homeItem.subtitle ?? '';
  }

  private formatTimeRange(start: string, end: string): string {
    const endMatch = end.match(/\s(AM|PM)$/);
    if (endMatch && start.endsWith(` ${endMatch[1]}`)) {
      return `${start.replace(/\s(AM|PM)$/, '')} – ${end}`;
    }
    return `${start} – ${end}`;
  }

  private formatEventDates(startDate?: string, endDate?: string): string {
    if (!startDate && !endDate) return '';
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const dayStr = start ? format(start, 'EEEE') : '';
    const dateStr =
      start && end && start.getTime() === end.getTime()
        ? format(start, 'MMMM d, yyyy')
        : start && end
          ? `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
          : start
            ? format(start, 'MMMM d, yyyy')
            : end
              ? format(end, 'MMMM d, yyyy')
              : '';
    const timeStr = start ? format(start, 'h:mm a') : '';
    if (timeStr && dayStr && start) {
      const timeRange =
        end && start.getTime() !== end.getTime()
          ? this.formatTimeRange(format(start, 'h:mm a'), format(end, 'h:mm a'))
          : timeStr;
      return `${dayStr} ${timeRange}\n${dateStr}`;
    }
    return dateStr;
  }
}
