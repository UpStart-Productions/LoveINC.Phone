import { Injectable, InjectionToken, Optional, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ServiceUnlockDatabaseService } from './service-unlock-database.service';
import type { IntakeValidateProvider, UnlockPhraseProvider, Voucher } from '../types/service-unlock.types';

/** Default mock phrase when no API provider is configured. */
export const DEFAULT_MOCK_PHRASE = 'Love INC Loves You';

/** Injection token for the unlock phrase provider. Host app provides this when API is ready. */
export const UNLOCK_PHRASE_PROVIDER = new InjectionToken<UnlockPhraseProvider>(
  'ServiceUnlock.UnlockPhraseProvider'
);

/** Injection token for intake phrase validation via API. Host app provides this to wire API. */
export const INTAKE_VALIDATE_PROVIDER = new InjectionToken<IntakeValidateProvider>(
  'ServiceUnlock.IntakeValidateProvider'
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
    @Optional() @Inject(UNLOCK_PHRASE_PROVIDER) private phraseProvider: UnlockPhraseProvider | null,
    @Optional() @Inject(INTAKE_VALIDATE_PROVIDER) private intakeValidateProvider: IntakeValidateProvider | null
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
  async ensureInitialized(force = false): Promise<void> {
    if (this.initialized && !force) return;
    if (force) this.initialized = false;
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

  /** Validate decoded QR content via API and unlock on success. */
  async unlockWithPhrase(decoded: string): Promise<{ success: boolean; message?: string }> {
    if (!this.intakeValidateProvider) {
      return { success: false, message: 'Intake validation not configured. Please update the app.' };
    }
    const phrase = (decoded ?? '').trim();
    if (!phrase) {
      return { success: false, message: 'No QR code detected. Please try again.' };
    }
    try {
      const result = await this.intakeValidateProvider.validate(phrase);
      if (result.success) {
        await this.db.setUnlockState();
        this.unlockState$.next(true);
        return { success: true };
      }
      return { success: false, message: result.message ?? 'Validation failed.' };
    } catch (err) {
      const message = (err as Error)?.message ?? 'Unable to validate. Please check your connection and try again.';
      return { success: false, message };
    }
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

  private vouchers$ = new BehaviorSubject<Voucher[]>(MOCK_VOUCHERS);

  /** Get vouchers. Mock data until API is wired. */
  getVouchers(): Observable<Voucher[]> {
    return this.vouchers$.asObservable();
  }

  /** Clear vouchers (e.g. for testing). Resets to empty until app reload or API refetch. */
  clearVouchers(): void {
    this.vouchers$.next([]);
  }

  /** Reset vouchers to mock data (after clear, for testing). */
  resetVouchers(): void {
    this.vouchers$.next([...MOCK_VOUCHERS]);
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
