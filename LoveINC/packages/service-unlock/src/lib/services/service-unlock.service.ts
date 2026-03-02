import { Injectable, InjectionToken, Optional, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ServiceUnlockDatabaseService } from './service-unlock-database.service';
import type { UnlockPhraseProvider, Voucher } from '../types/service-unlock.types';

/** Default mock phrase when no API provider is configured. */
export const DEFAULT_MOCK_PHRASE = 'Love INC Loves You';

/** Injection token for the unlock phrase provider. Host app provides this when API is ready. */
export const UNLOCK_PHRASE_PROVIDER = new InjectionToken<UnlockPhraseProvider>(
  'ServiceUnlock.UnlockPhraseProvider'
);

/** Mock vouchers for UI development until API is wired. */
const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 'mock-1',
    serviceId: 'diapers-and-more',
    serviceLabel: 'Diapers & More',
    status: 'approved',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    serviceId: 'linens',
    serviceLabel: 'Linens',
    status: 'approved',
    requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class ServiceUnlockService {
  private unlockState$ = new BehaviorSubject<boolean>(false);
  private initialized = false;

  constructor(
    private db: ServiceUnlockDatabaseService,
    @Optional() @Inject(UNLOCK_PHRASE_PROVIDER) private phraseProvider: UnlockPhraseProvider | null
  ) {}

  /** Whether the user has completed intake (unlocked). */
  get isUnlocked$(): Observable<boolean> {
    return this.unlockState$.asObservable();
  }

  /** Synchronous check - use after ensureInitialized(). */
  get isUnlocked(): boolean {
    return this.unlockState$.value;
  }

  /** Initialize and load unlock state from DB. Call once at app startup or when entering Profile. */
  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    try {
      const state = await this.db.getUnlockState();
      this.unlockState$.next(!!state);
    } catch {
      this.unlockState$.next(false);
    }
    this.initialized = true;
  }

  /** Get the expected unlock phrase. Uses API provider if configured, else mock. */
  async getUnlockPhrase(): Promise<string | null> {
    if (this.phraseProvider) {
      return this.phraseProvider.getUnlockPhrase();
    }
    return DEFAULT_MOCK_PHRASE;
  }

  /** Validate decoded QR content and unlock if it matches. */
  async unlockWithPhrase(decoded: string): Promise<{ success: boolean; message?: string }> {
    const phrase = await this.getUnlockPhrase();
    if (!phrase?.trim()) {
      return { success: false, message: 'Unlock phrase not available. Try again later.' };
    }
    const normalized = (decoded ?? '').trim().toLowerCase();
    const expected = phrase.trim().toLowerCase();
    if (normalized !== expected) {
      return { success: false, message: 'Invalid QR code. Please scan the QR from your intake materials.' };
    }
    await this.db.setUnlockState();
    this.unlockState$.next(true);
    return { success: true };
  }

  /** Clear unlock state (e.g. for testing). */
  async clearUnlock(): Promise<void> {
    await this.db.clearUnlockState();
    this.unlockState$.next(false);
  }

  /**
   * Whether the user can contact the provider directly.
   * For now, only checks intake unlock. When API adds requiresIntake/requiresVoucher, extend.
   */
  canContactProvider(_service?: { requiresIntake?: boolean; requiresVoucher?: boolean; id?: string }): boolean {
    return this.isUnlocked;
  }

  /** Get vouchers. Mock data until API is wired. */
  getVouchers(): Observable<Voucher[]> {
    return of(MOCK_VOUCHERS);
  }

  /** Whether the user has a valid (approved, not expired) voucher for the given service. */
  hasValidVoucher(serviceId: string): Observable<boolean> {
    return this.getVouchers().pipe(
      map((vouchers) =>
        vouchers.some(
          (v) =>
            v.serviceId === serviceId &&
            v.status === 'approved' &&
            new Date(v.validUntil) > new Date()
        )
      ),
      catchError(() => of(false))
    );
  }
}
