import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

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

/** API.Bible passage response (api.scripture.api.bible) */
export interface ApiBiblePassageResponse {
  data: {
    id: string;
    reference: string;
    content: string;
    copyright?: string;
  };
}

/** Normalized verse for display */
export interface VerseOfTheDay {
  reference: string;
  /** Plain text fallback (from NET Bible) */
  text: string;
  /** HTML from API.Bible (passage with optional notes) */
  contentHtml?: string;
  /** DEBUG: raw API.Bible response (remove after debugging) */
  debugApiResponse?: string;
}

@Injectable({ providedIn: 'root' })
export class VerseOfTheDayService {
  constructor(private readonly http: HttpClient) {}

  /** API.Bible Bible ID. KJV = de4e12af7f28f599-01 */
  private readonly API_BIBLE_ID = 'de4e12af7f28f599-01';

  /**
   * Fetches the verse of the day: (1) NET Bible for reference, (2) API.Bible for passage content (with notes).
   */
  getVerseOfTheDay(): Observable<VerseOfTheDay | null> {
    return this.http.get<NetBibleVerse[]>(VERSE_OF_THE_DAY_API_URL).pipe(
      map((verses) => this.buildReferenceAndText(verses)),
      switchMap((base) => {
        if (!base) return of(null);
        return this.enrichWithApiBible(base);
      }),
      catchError((err) => {
        console.warn('VerseOfTheDayService: failed to fetch verse', err?.message ?? err);
        return of(null);
      })
    );
  }

  private enrichWithApiBible(base: VerseOfTheDay): Observable<VerseOfTheDay> {
    const key = (environment as { apiBibleKey?: string }).apiBibleKey?.trim();
    if (!key) return of({ ...base, debugApiResponse: 'API.Bible SKIPPED: no apiBibleKey in environment' });

    const passageId = this.toUsfmPassageId(base.reference);
    if (!passageId) return of({ ...base, debugApiResponse: `API.Bible SKIPPED: could not parse passage ID from "${base.reference}"` });

    const params = new URLSearchParams({
      'include-notes': 'true',
      'include-titles': 'true',
    });
    const apiBase = (environment as { apiBibleBase?: string }).apiBibleBase ?? 'https://api.scripture.api.bible';
    const url = `${apiBase}/v1/bibles/${this.API_BIBLE_ID}/verses/${passageId}?${params}`;
    const headers = new HttpHeaders({ 'api-key': key });

    return this.http.get<ApiBiblePassageResponse>(url, { headers }).pipe(
      map((res) => ({
        ...base,
        contentHtml: res.data?.content?.trim() || undefined,
        debugApiResponse: JSON.stringify(res, null, 2),
      })),
      catchError((err) => {
        const errMsg = err?.error ? JSON.stringify(err.error) : (err?.message ?? String(err));
        return of({
          ...base,
          debugApiResponse: `API.Bible FAILED: ${errMsg}\nStatus: ${err?.status ?? 'unknown'}`,
        });
      })
    );
  }

  /** Convert "Romans 5:1" or "Romans 5:1-3" to USFM "ROM.5.1" or "ROM.5.1-3" */
  private toUsfmPassageId(reference: string): string | null {
    const BOOK_TO_USFM: Record<string, string> = {
      Genesis: 'GEN', Exodus: 'EXO', Leviticus: 'LEV', Numbers: 'NUM', Deuteronomy: 'DEU',
      Joshua: 'JOS', Judges: 'JDG', Ruth: 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
      '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
      Ezra: 'EZR', Nehemiah: 'NEH', Esther: 'EST', Job: 'JOB', Psalm: 'PSA', Psalms: 'PSA',
      Proverbs: 'PRO', Ecclesiastes: 'ECC', 'Song of Solomon': 'SNG', 'Song of Songs': 'SNG',
      Isaiah: 'ISA', Jeremiah: 'JER', Lamentations: 'LAM', Ezekiel: 'EZK', Daniel: 'DAN',
      Hosea: 'HOS', Joel: 'JOL', Amos: 'AMO', Obadiah: 'OBA', Jonah: 'JON', Micah: 'MIC',
      Nahum: 'NAM', Habakkuk: 'HAB', Zephaniah: 'ZEP', Haggai: 'HAG', Zechariah: 'ZEC',
      Malachi: 'MAL', Matthew: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN', Acts: 'ACT',
      Romans: 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', Galatians: 'GAL',
      Ephesians: 'EPH', Philippians: 'PHP', Colossians: 'COL',
      '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
      Titus: 'TIT', Philemon: 'PHM', Hebrews: 'HEB', James: 'JAS',
      '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN',
      Jude: 'JUD', Revelation: 'REV',
    };

    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    const [, bookName, chapter, verse, verseEnd] = match;
    const usfm = BOOK_TO_USFM[bookName.trim()];
    if (!usfm) return null;
    const passage = verseEnd ? `${usfm}.${chapter}.${verse}-${verseEnd}` : `${usfm}.${chapter}.${verse}`;
    return passage;
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
