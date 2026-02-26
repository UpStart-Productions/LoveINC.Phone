import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';

/** Injection token for ESV API key. Provide in app config when using ESV cross-refs/footnotes. */
export const VERSE_OF_THE_DAY_ESV_API_KEY = new InjectionToken<string>(
  'VERSE_OF_THE_DAY_ESV_API_KEY'
);

/** NET Bible API base URL. Overridable via injection token when packaged. */
export const VERSE_OF_THE_DAY_API_URL =
  'https://labs.bible.org/api/?passage=votd&type=json';

/** ESV API base URL for passage HTML (cross-refs, footnotes) */
export const ESV_API_PASSAGE_URL = 'https://api.esv.org/v3/passage/html/';

/** Raw verse object from NET Bible API */
export interface NetBibleVerse {
  bookname: string;
  chapter: string;
  verse: string;
  text: string;
}

/** ESV API passage response (documented at api.esv.org) */
export interface EsvPassageResponse {
  query: string;
  canonical: string;
  passage_meta: unknown[];
  passages: string[];
}

/** Normalized verse for display */
export interface VerseOfTheDay {
  reference: string;
  /** Plain text fallback (from NET Bible) */
  text: string;
  /** HTML from ESV with cross-refs and footnotes when API key is configured */
  contentHtml?: string;
}

@Injectable({ providedIn: 'root' })
export class VerseOfTheDayService {
  constructor(
    private readonly http: HttpClient,
    @Optional() @Inject(VERSE_OF_THE_DAY_ESV_API_KEY) private readonly esvApiKey?: string
  ) {}

  /**
   * Fetches the verse of the day: (1) NET Bible for reference, (2) ESV for rich content.
   * When esvApiKey is configured, uses ESV HTML (cross-refs, footnotes). Otherwise NET Bible text only.
   */
  getVerseOfTheDay(): Observable<VerseOfTheDay | null> {
    return this.http.get<NetBibleVerse[]>(VERSE_OF_THE_DAY_API_URL).pipe(
      map((verses: NetBibleVerse[]) => this.buildReferenceAndText(verses)),
      switchMap((base) => {
        if (!base) return of(null);
        const key = this.esvApiKey?.trim();
        if (!key) return of(base);

        const params = new URLSearchParams({
          q: base.reference,
          'include-crossrefs': 'true',
          'include-footnotes': 'true',
          'include-footnote-body': 'true',
          'include-passage-references': 'true',
        });
        const url = `${ESV_API_PASSAGE_URL}?${params}`;
        const headers = new HttpHeaders({
          Authorization: `Token ${key}`,
        });

        return this.http.get<EsvPassageResponse>(url, { headers }).pipe(
          map((res: EsvPassageResponse) => ({
            ...base,
            contentHtml: res.passages?.join('')?.trim() || undefined,
          })),
          catchError((err) => {
            console.warn('VerseOfTheDayService: ESV fetch failed, using NET Bible text', err?.message ?? err);
            return of(base);
          })
        );
      }),
      catchError((err) => {
        console.warn('VerseOfTheDayService: failed to fetch verse', err?.message ?? err);
        return of(null);
      })
    );
  }

  private buildReferenceAndText(verses: NetBibleVerse[] | null): VerseOfTheDay | null {
    if (!verses?.length) return null;
    const first = verses[0];
    const last = verses[verses.length - 1];
    const reference =
      verses.length === 1
        ? `${first.bookname} ${first.chapter}:${first.verse}`
        : `${first.bookname} ${first.chapter}:${first.verse}-${last.verse}`;
    const text = verses.map((v) => (v.text ?? '').trim()).join(' ').trim();
    return { reference, text };
  }
}
