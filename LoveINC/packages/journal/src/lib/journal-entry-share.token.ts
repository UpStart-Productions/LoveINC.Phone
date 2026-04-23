import { InjectionToken } from '@angular/core';

/**
 * Rich HTML from the editor plus display title. Host should wire to app {@link SharingService#shareContent}
 * (Ionic “Share Content” action sheet: Email as Text, Text/SMS, Cancel).
 */
export interface JournalEntryShareOptions {
  title: string;
  subject?: string;
  htmlContent: string;
}

export const JOURNAL_ENTRY_SHARE = new InjectionToken<
  (options: JournalEntryShareOptions) => Promise<void>
>('JOURNAL_ENTRY_SHARE');
