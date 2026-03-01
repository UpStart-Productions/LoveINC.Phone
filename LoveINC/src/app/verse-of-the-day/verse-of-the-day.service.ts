import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

/** API.Bible passage response (rest.api.bible) */
export interface ApiBiblePassageResponse {
  data: {
    id: string;
    orgId?: string;
    bibleId: string;
    bookId: string;
    content: string;
    reference?: string;
  };
}

/** Normalized verse for display */
export interface VerseOfTheDay {
  reference: string;
  /** Plain text fallback */
  text: string;
  /** HTML from API.Bible (passage content) */
  contentHtml?: string;
}

/** Curated passages for verse of the day (one per day of month). USFM format. */
const VOTD_PASSAGES = [
  'JER.29.11',
  'PSA.23.1',
  '1CO.13.4-7',
  'PHP.4.13',
  'JHN.3.16',
  'ROM.8.28',
  'ISA.41.10',
  'PSA.46.1',
  'GAL.5.22-23',
  'HEB.11.1',
  '2TI.1.7',
  '1CO.10.13',
  'PRO.22.6',
  'ISA.40.31',
  'JOS.1.9',
  'HEB.12.2',
  'MAT.11.28',
  'ROM.10.9-10',
  'PHP.2.3-4',
  'MAT.5.43-44',
  'PSA.119.105',
  'PRO.3.5-6',
  'JHN.14.6',
  'ROM.12.2',
  'COL.3.23',
  'PSA.27.1',
  'MAT.28.19-20',
  '2CO.5.17',
  'EPH.2.8-9',
  '1JN.4.7',
  'REV.3.20',
];

/** USFM book code to display name */
const USFM_TO_BOOK: Record<string, string> = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalm', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah',
  LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel',
  AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAH: 'Nahum',
  HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts',
  ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians',
  EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
  '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy',
  TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James',
  '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  JUD: 'Jude', REV: 'Revelation',
};

@Injectable({ providedIn: 'root' })
export class VerseOfTheDayService {
  constructor(private readonly http: HttpClient) {}

  /** API.Bible Bible ID. KJV - no notes in API.Bible for available versions. */
  private readonly API_BIBLE_ID = 'de4e12af7f28f599-01';

  /**
   * Fetches the verse of the day from API.Bible.
   */
  getVerseOfTheDay(): Observable<VerseOfTheDay | null> {
    const key = (environment as { apiBibleKey?: string }).apiBibleKey?.trim();
    if (!key) {
      console.warn('VerseOfTheDayService: no apiBibleKey in environment');
      return of(null);
    }

    const dayOfMonth = new Date().getDate();
    const passageId = VOTD_PASSAGES[(dayOfMonth - 1) % VOTD_PASSAGES.length];
    const reference = this.passageIdToReference(passageId);

    const params = new URLSearchParams({
      'include-notes': 'true',
      'include-titles': 'true',
    });
    const apiBase = (environment as { apiBibleBase?: string }).apiBibleBase ?? 'https://rest.api.bible';
    const url = `${apiBase}/v1/bibles/${this.API_BIBLE_ID}/passages/${passageId}?${params}`;
    const headers = new HttpHeaders({ 'api-key': key });

    return this.http.get<ApiBiblePassageResponse>(url, { headers }).pipe(
      map((res) => {
        const content = res.data?.content?.trim();
        return {
          reference: res.data?.reference ?? reference,
          text: this.stripHtml(content ?? ''),
          contentHtml: content || undefined,
        };
      }),
      catchError((err) => {
        console.warn('VerseOfTheDayService: failed to fetch verse', err?.message ?? err);
        return of(null);
      })
    );
  }

  /** Convert USFM passage ID (e.g. ROM.5.1 or ROM.5.1-3) to display reference */
  private passageIdToReference(passageId: string): string {
    const match = passageId.match(/^([1-3]?[A-Z0-9]+)\.(\d+)\.(\d+)(?:-(\d+))?$/);
    if (!match) return passageId;
    const [, usfm, chapter, verse, verseEnd] = match;
    const book = USFM_TO_BOOK[usfm ?? ''] ?? usfm;
    return verseEnd ? `${book} ${chapter}:${verse}-${verseEnd}` : `${book} ${chapter}:${verse}`;
  }

  /** Strip HTML tags for plain text fallback */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
