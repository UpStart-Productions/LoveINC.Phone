import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'loveinc_share_app_card_dismissed';

@Injectable({ providedIn: 'root' })
export class DismissedShareAppCardService {
  private dismissed$ = new BehaviorSubject<boolean>(this.loadFromStorage());

  private loadFromStorage(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private saveToStorage(dismissed: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, dismissed ? 'true' : 'false');
    } catch {
      // ignore
    }
  }

  isDismissed(): boolean {
    return this.dismissed$.value;
  }

  getDismissed$(): Observable<boolean> {
    return this.dismissed$.asObservable();
  }

  dismiss(): void {
    this.dismissed$.next(true);
    this.saveToStorage(true);
  }

  clear(): void {
    this.dismissed$.next(false);
    this.saveToStorage(false);
  }
}
