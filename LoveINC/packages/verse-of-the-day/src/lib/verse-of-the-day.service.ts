import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { Observable, from, catchError, of } from 'rxjs';

/** Injection token for optional cache. Host provides implementation for SQLite/file caching. */
export const VERSE_OF_THE_DAY_CACHE = new InjectionToken<VerseOfTheDayCache>(
  'VERSE_OF_THE_DAY_CACHE'
);

/** Injection token for YouTube embed base URL (fixes Error 152/153 in Capacitor). e.g. 'https://api.grovlink.com/embed' */
export const VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL = new InjectionToken<string>(
  'VERSE_OF_THE_DAY_YOUTUBE_EMBED_BASE_URL'
);

/** Injection token for optional share handler. When provided, share button is shown. */
export const VERSE_OF_THE_DAY_SHARE = new InjectionToken<(verse: VerseOfTheDay) => Promise<void>>(
  'VERSE_OF_THE_DAY_SHARE'
);

/** Cache adapter for verse-of-the-day. Host implements using SQLite or other storage. */
export interface VerseOfTheDayCache {
  get(dateKey: string): Promise<VerseOfTheDay | null>;
  set(dateKey: string, verse: VerseOfTheDay): Promise<void>;
}

/** Christian Context API response (getcontext.xyz) */
export interface ChristianContextResponse {
  verse_category: string;
  verse_reference: string;
  verse_bookchapter: string;
  verse_content: string;
  verse_url: string;
  commentary_reference?: string;
  commentary_bookchapter?: string;
  commentary_content?: string;
  commentary_url?: string;
  commentary_author?: string;
  commentary_publisher?: string;
  sermon_reference?: string;
  sermon_bookchapter?: string;
  sermon_content?: string;
  sermon_url?: string;
  sermon_author?: string;
  sermon_publisher?: string;
}

/** Normalized verse for display */
export interface VerseOfTheDay {
  verseCategory: string;
  reference: string;
  content: string;
  verseUrl?: string;
  commentaryTitle?: string;
  commentaryUrl?: string;
  commentaryAuthor?: string;
  commentaryPublisher?: string;
  sermonTitle?: string;
  sermonUrl?: string;
  sermonAuthor?: string;
  sermonPublisher?: string;
  /** YouTube embed URL for sermon (when sermon_url is YouTube) */
  sermonEmbedUrl?: string;
}

/** Themes from Christian Context API - one selected per month (hidden from user) */
const THEMES = [
  'Wisdom', 'Love', 'Faith', 'Peace', 'Hope', 'Joy', 'Trust', 'Grace',
  'Courage', 'Forgiveness', 'Thankfulness', 'Patience', 'Contentment',
  'Salvation', 'God\'s Love', 'Rest', 'Purpose', 'Transformation',
];

const CONTEXT_API_BASE = 'https://getcontext.xyz/api/api.php';

@Injectable({ providedIn: 'root' })
export class VerseOfTheDayService {
  constructor(
    @Optional() @Inject(VERSE_OF_THE_DAY_CACHE) private readonly cache?: VerseOfTheDayCache
  ) {}

  /**
   * Fetches the verse of the day: checks cache first (when provided), then Christian Context API.
   * Theme is selected by month (hidden from user). Cached per day for push notification consistency.
   */
  getVerseOfTheDay(): Observable<VerseOfTheDay | null> {
    return from(this.getCachedOrFetch()).pipe(
      catchError((err) => {
        console.warn('VerseOfTheDayService: failed', err?.message ?? err);
        return of(null);
      })
    );
  }

  private async getCachedOrFetch(): Promise<VerseOfTheDay | null> {
    const dateKey = this.getDateKey();
    if (this.cache) {
      const cached = await this.cache.get(dateKey);
      if (cached) return this.normalizeEmbedUrl(cached);
    }

    const theme = this.getThemeForMonth();
    const url = `${CONTEXT_API_BASE}?query=${encodeURIComponent(theme)}`;
    let response: VerseOfTheDay | null = null;
    try {
      const { data } = await CapacitorHttp.get({ url });
      response = this.mapToVerseOfTheDay(data as ChristianContextResponse);
    } catch (err) {
      console.warn('VerseOfTheDayService: API failed', (err as Error)?.message ?? err);
    }

    if (response && this.cache) {
      await this.cache.set(dateKey, response);
      return response;
    }
    return response;
  }

  private getDateKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private getThemeForMonth(): string {
    const d = new Date();
    const seed = d.getFullYear() * 12 + d.getMonth();
    const index = seed % THEMES.length;
    return THEMES[index];
  }

  private mapToVerseOfTheDay(res: ChristianContextResponse): VerseOfTheDay {
    const sermonEmbedUrl = res.sermon_url ? this.youtubeToEmbedUrl(res.sermon_url) : undefined;
    return {
      verseCategory: res.verse_category ?? '',
      reference: res.verse_reference ?? '',
      content: res.verse_content ?? '',
      verseUrl: res.verse_url?.trim() || undefined,
      commentaryTitle: res.commentary_content?.trim() || undefined,
      commentaryUrl: res.commentary_url?.trim() || undefined,
      commentaryAuthor: res.commentary_author?.trim() || undefined,
      commentaryPublisher: res.commentary_publisher?.trim() || undefined,
      sermonTitle: res.sermon_content?.trim() || undefined,
      sermonUrl: res.sermon_url?.trim() || undefined,
      sermonAuthor: res.sermon_author?.trim() || undefined,
      sermonPublisher: res.sermon_publisher?.trim() || undefined,
      sermonEmbedUrl,
    };
  }

  private youtubeToEmbedUrl(url: string): string | undefined {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (!match) return undefined;
    return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  }

  /** Fix YouTube Error 153: use youtube-nocookie.com for cached verses with old URL */
  private normalizeEmbedUrl(verse: VerseOfTheDay): VerseOfTheDay {
    if (verse.sermonEmbedUrl?.includes('youtube.com/embed/')) {
      return {
        ...verse,
        sermonEmbedUrl: verse.sermonEmbedUrl.replace(
          'youtube.com/embed/',
          'youtube-nocookie.com/embed/'
        ),
      };
    }
    return verse;
  }
}
