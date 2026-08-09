import { Injectable } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';

export interface ScriptureVerse {
  reference: string;
  text: string;
  translationName?: string;
}

interface BibleApiVerse {
  text?: string;
}

interface BibleApiResponse {
  reference?: string;
  text?: string;
  translation_name?: string;
  verses?: BibleApiVerse[];
  error?: string;
}

const BIBLE_API_BASE = 'https://bible-api.com';

/**
 * Fetches scripture text for a specific reference (e.g. "Matthew 6:25-34") from bible-api.com
 * (World English Bible, public domain, no auth required). Uses CapacitorHttp (native HTTP client)
 * so it works from the app's file:// origin without CORS issues. Caches per-session since
 * Transformation Tool scripture references are static.
 */
@Injectable({ providedIn: 'root' })
export class ScriptureVerseService {
  private readonly cache = new Map<string, ScriptureVerse | null>();

  async getVerse(reference: string): Promise<ScriptureVerse | null> {
    const ref = this.normalizeReference(reference);
    if (!ref) return null;
    if (this.cache.has(ref)) {
      return this.cache.get(ref) ?? null;
    }
    const url = `${BIBLE_API_BASE}/${encodeURIComponent(ref)}?translation=web`;
    try {
      const { data, status } = await CapacitorHttp.get({ url });
      if (status !== 200) {
        this.cache.set(ref, null);
        return null;
      }
      const res = this.parseResponse(data);
      if (!res || res.error) {
        this.cache.set(ref, null);
        return null;
      }
      const text = this.extractText(res);
      if (!text) {
        this.cache.set(ref, null);
        return null;
      }
      const verse: ScriptureVerse = {
        reference: res.reference?.trim() || ref,
        text,
        translationName: res.translation_name,
      };
      this.cache.set(ref, verse);
      return verse;
    } catch (err) {
      console.warn('ScriptureVerseService: failed to fetch', ref, (err as Error)?.message ?? err);
      this.cache.set(ref, null);
      return null;
    }
  }

  /** CMS refs often use en/em dashes in ranges; bible-api.com expects ASCII hyphens. */
  private normalizeReference(reference: string): string {
    return reference
      .trim()
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\s+/g, ' ');
  }

  private parseResponse(data: unknown): BibleApiResponse | null {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as BibleApiResponse;
      } catch {
        return null;
      }
    }
    if (data && typeof data === 'object') {
      return data as BibleApiResponse;
    }
    return null;
  }

  private extractText(res: BibleApiResponse): string {
    const direct = res.text?.trim().replace(/\n+/g, ' ') ?? '';
    if (direct) return direct;
    return (res.verses ?? [])
      .map((v) => v.text?.trim().replace(/\n+/g, ' '))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
}
