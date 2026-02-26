import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

/** NET Bible API base URL. Overridable via injection token when packaged. */
export const VERSE_OF_THE_DAY_API_URL =
  'https://labs.bible.org/api/?passage=votd&type=json';

/** Raw verse object from NET Bible API */
export interface NetBibleVerse {
  bookname: string;
  chapter: string;
  verse: string;
  text: string;
}

/** Normalized verse for display */
export interface VerseOfTheDay {
  reference: string;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class VerseOfTheDayService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the verse of the day from the NET Bible API.
   * Returns null on error (e.g. network, CORS).
   */
  getVerseOfTheDay(): Observable<VerseOfTheDay | null> {
    return this.http.get<NetBibleVerse[]>(VERSE_OF_THE_DAY_API_URL).pipe(
      map((verses) => this.normalizeVerse(verses)),
      catchError((err) => {
        console.warn('VerseOfTheDayService: failed to fetch verse', err?.message ?? err);
        return of(null);
      })
    );
  }

  private normalizeVerse(verses: NetBibleVerse[] | null): VerseOfTheDay | null {
    if (!verses?.length) return null;
    const v = verses[0];
    const reference = `${v.bookname} ${v.chapter}:${v.verse}`;
    const text = (v.text ?? '').trim();
    return { reference, text };
  }
}
