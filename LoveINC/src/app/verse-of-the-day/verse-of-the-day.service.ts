import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, catchError, of, firstValueFrom } from 'rxjs';
import { GrovLinkDatabaseService } from '../services/grovlink-database.service';

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
/** CORS proxy - Christian Context API does not send CORS headers */
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

@Injectable({ providedIn: 'root' })
export class VerseOfTheDayService {
  constructor(
    private readonly http: HttpClient,
    private readonly grovlinkDb: GrovLinkDatabaseService
  ) {}

  /**
   * Fetches the verse of the day: checks cache first, then Christian Context API.
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
    const cached = await this.getCachedVerse(dateKey);
    if (cached) return cached;

    const theme = this.getThemeForMonth();
    const apiUrl = `${CONTEXT_API_BASE}?query=${encodeURIComponent(theme)}`;
    const url = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
    const response = await firstValueFrom(
      this.http.get<ChristianContextResponse>(url).pipe(
        map((res) => this.mapToVerseOfTheDay(res)),
        catchError((err) => {
          console.warn('VerseOfTheDayService: API failed', err?.message ?? err);
          return of(null);
        })
      )
    );

    if (response) {
      await this.saveCachedVerse(dateKey, response);
      return response;
    }
    return null;
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
    return `https://www.youtube.com/embed/${match[1]}`;
  }

  private async getCachedVerse(dateKey: string): Promise<VerseOfTheDay | null> {
    try {
      const db = await this.grovlinkDb.getDbConnection();
      const result = await db.query(
        'SELECT json FROM verse_of_the_day_cache WHERE dateKey = ?',
        [dateKey]
      );
      if (result?.values?.length) {
        const row = result.values[0];
        const json = Array.isArray(row) ? row[0] : (row as Record<string, unknown>)['json'];
        if (typeof json === 'string') {
          return JSON.parse(json) as VerseOfTheDay;
        }
      }
    } catch (e) {
      console.warn('VerseOfTheDayService: cache read failed', e);
    }
    return null;
  }

  private async saveCachedVerse(dateKey: string, verse: VerseOfTheDay): Promise<void> {
    try {
      const db = await this.grovlinkDb.getDbConnection();
      await db.run(
        'INSERT OR REPLACE INTO verse_of_the_day_cache (dateKey, json) VALUES (?, ?)',
        [dateKey, JSON.stringify(verse)]
      );
    } catch (e) {
      console.warn('VerseOfTheDayService: cache write failed', e);
    }
  }
}
