/**
 * Intake unlock state stored in SQLite.
 */
export interface UnlockState {
  id: string;
  intakeCompletedAt: string; // ISO date string
}

/**
 * Voucher as received from API or displayed in app.
 */
export interface Voucher {
  id: string;
  serviceId: string;
  serviceLabel: string;
  status: 'pending' | 'approved' | 'expired';
  requestedAt: string;
  approvedAt?: string;
  validUntil: string;
  /** When present, voucher has an explicit expiry date to display */
  expiresAt?: string;
  /** Provider offering name, when available from API */
  providerOffering?: string | null;
  /** Location/address, when available from API */
  location?: string | null;
}

/**
 * Provider for fetching the intake unlock phrase from API.
 * Host app wires this to their platform API.
 */
export interface UnlockPhraseProvider {
  getUnlockPhrase(): Promise<string | null>;
}

/**
 * Provider for validating intake phrase via API.
 * Host app wires this to their platform API; it fetches user email from Profile.
 */
export interface IntakeValidateProvider {
  validate(phrase: string): Promise<{ success: boolean; message?: string }>;
}
