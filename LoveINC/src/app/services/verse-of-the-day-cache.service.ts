import { Injectable } from '@angular/core';
import {
  VerseOfTheDayCache,
  VerseOfTheDay,
} from '@upstart-productions/verse-of-the-day';
import { GrovLinkDatabaseService } from './grovlink-database.service';

/**
 * Implements VerseOfTheDayCache using GrovLink SQLite.
 * Used for push notification consistency (same verse cached per day).
 */
@Injectable({ providedIn: 'root' })
export class VerseOfTheDayCacheService implements VerseOfTheDayCache {
  constructor(private readonly grovlinkDb: GrovLinkDatabaseService) {}

  async get(dateKey: string): Promise<VerseOfTheDay | null> {
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
      console.warn('VerseOfTheDayCacheService: read failed', e);
    }
    return null;
  }

  async set(dateKey: string, verse: VerseOfTheDay): Promise<void> {
    try {
      const db = await this.grovlinkDb.getDbConnection();
      await db.run(
        'INSERT OR REPLACE INTO verse_of_the_day_cache (dateKey, json) VALUES (?, ?)',
        [dateKey, JSON.stringify(verse)]
      );
    } catch (e) {
      console.warn('VerseOfTheDayCacheService: write failed', e);
    }
  }
}
