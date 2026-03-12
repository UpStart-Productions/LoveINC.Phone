import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'loveinc_dismissed_voucher_ids';

@Injectable({ providedIn: 'root' })
export class DismissedVouchersService {
  private dismissed$ = new BehaviorSubject<Set<string>>(this.loadFromStorage());

  private loadFromStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        return new Set(Array.isArray(arr) ? arr : []);
      }
    } catch {
      // ignore
    }
    return new Set();
  }

  private saveToStorage(ids: Set<string>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // ignore
    }
  }

  isDismissed(id: string): boolean {
    return this.dismissed$.value.has(id);
  }

  getDismissed(): Set<string> {
    return this.dismissed$.value;
  }

  getDismissed$(): Observable<Set<string>> {
    return this.dismissed$.asObservable();
  }

  dismiss(id: string): void {
    const next = new Set(this.dismissed$.value);
    next.add(id);
    this.dismissed$.next(next);
    this.saveToStorage(next);
  }

  clear(): void {
    this.dismissed$.next(new Set());
    this.saveToStorage(new Set());
  }
}
