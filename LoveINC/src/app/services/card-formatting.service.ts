import { Injectable } from '@angular/core';
import {
  CardType,
  CardTypeLabels,
  CardTypeIcons,
  CardTypeColors,
} from '../shared/models/home-card.model';
import {
  formatEventSubtitle,
  formatClassSessionSubtitle,
  dayNumberTo2Letter,
  formatTimeStringFull,
  joinWithAppDot,
} from '../shared/utils';
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

  /**
   * Resolves start/end ISO strings for Add to Calendar on home feed event/class cards.
   * Uses the same class session resolution as subtitles (nextSession → offerings).
   */
  getCalendarDateRangeForHome(
    item: PlatformHomeFeedItem & { type: CardType },
    event: PlatformEvent | undefined,
    cls: PlatformClass | undefined
  ): { startDate: string; endDate: string } | null {
    if (item.type === 'event') {
      if (event) {
        return { startDate: event.startDate, endDate: event.endDate };
      }
      if (item.startDate && item.endDate) {
        return { startDate: item.startDate, endDate: item.endDate };
      }
      return null;
    }
    if (item.type === 'class') {
      if (cls?.nextSession) {
        return {
          startDate: cls.nextSession.startDate,
          endDate: cls.nextSession.endDate,
        };
      }
      if (cls?.offerings?.length) {
        const derived = this.deriveNextSessionFromOfferings(cls.offerings);
        if (derived) {
          return { startDate: derived.startDate, endDate: derived.endDate };
        }
      }
      if (item.startDate && item.endDate) {
        return { startDate: item.startDate, endDate: item.endDate };
      }
      return null;
    }
    return null;
  }

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
        return this.formatEventSubtitleForCard(item as PlatformEvent | PlatformHomeFeedItem);
      case 'class':
        return this.formatClassSubtitle(item as PlatformClass | PlatformHomeFeedItem);
      case 'impact':
        return ''; // Never use shortDescription in subtitle
      default:
        return this.formatGenericSubtitle(item);
    }
  }

  private formatEventSubtitleForCard(item: PlatformEvent | PlatformHomeFeedItem): string {
    const startDate = (item as PlatformEvent).startDate ?? (item as PlatformHomeFeedItem).startDate;
    const endDate = (item as PlatformEvent).endDate ?? (item as PlatformHomeFeedItem).endDate;
    if (startDate || endDate) {
      return formatEventSubtitle(startDate, endDate);
    }
    return (item as PlatformHomeFeedItem).subtitle ?? '';
  }

  private formatClassSubtitle(item: PlatformClass | PlatformHomeFeedItem): string {
    const platformClass = item as PlatformClass;
    const homeItem = item as PlatformHomeFeedItem;

    // PlatformClass: nextSession or offerings
    if (platformClass.nextSession) {
      return formatClassSessionSubtitle(platformClass.nextSession);
    }
    if (platformClass.offerings?.length) {
      const derived = this.deriveNextSessionFromOfferings(platformClass.offerings);
      if (derived) return formatClassSessionSubtitle(derived);
    }

    // PlatformHomeFeedItem: startDate/endDate or instructor
    if (homeItem.startDate || homeItem.endDate) {
      return formatEventSubtitle(homeItem.startDate, homeItem.endDate);
    }
    if (homeItem.instructor) {
      return `Instructor: ${homeItem.instructor}`;
    }

    return homeItem.subtitle ?? '';
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
        ? rule.daysOfWeek.map((n) => dayNumberTo2Letter(n)).join(', ')
        : '';
    const rawTime = joinWithAppDot(rule?.startTime, rule?.endTime) || '';
    const time = formatTimeStringFull(rawTime) || rawTime;
    return { startDate, endDate, dayOfWeek, time };
  }

  private formatGenericSubtitle(item: CardApiItem): string {
    const homeItem = item as PlatformHomeFeedItem;
    return homeItem.subtitle ?? '';
  }
}
