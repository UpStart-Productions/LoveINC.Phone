import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BehaviorSubject, Observable } from 'rxjs';
import type { PlatformJobListing } from '../services/platform/types';

const STORAGE_KEY = 'loveinc_saved_jobs';

export type SavedJobRecord = {
  id: string;
  savedAt: string;
  job: PlatformJobListing;
};

@Injectable({ providedIn: 'root' })
export class SavedJobsService {
  private readonly saved$ = new BehaviorSubject<SavedJobRecord[]>(this.read());

  watch(): Observable<SavedJobRecord[]> {
    return this.saved$.asObservable();
  }

  list(): SavedJobRecord[] {
    return [...this.saved$.value].sort((a, b) => {
      const posted = (b.job.postedAt ?? '').localeCompare(a.job.postedAt ?? '');
      return posted !== 0 ? posted : b.savedAt.localeCompare(a.savedAt);
    });
  }

  isSaved(id: string): boolean {
    return this.saved$.value.some((row) => row.id === id);
  }

  toggle(job: PlatformJobListing): void {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    if (this.isSaved(job.id)) {
      this.remove(job.id);
      return;
    }
    const next: SavedJobRecord[] = [
      { id: job.id, savedAt: new Date().toISOString(), job },
      ...this.saved$.value.filter((row) => row.id !== job.id),
    ];
    this.write(next);
  }

  remove(id: string): void {
    this.write(this.saved$.value.filter((row) => row.id !== id));
  }

  private read(): SavedJobRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedJobRecord[];
      return Array.isArray(parsed) ? parsed.filter((row) => row?.id && row.job) : [];
    } catch {
      return [];
    }
  }

  private write(rows: SavedJobRecord[]): void {
    this.saved$.next(rows);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // ignore quota / private mode
    }
  }
}
