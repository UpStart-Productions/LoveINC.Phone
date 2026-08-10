import { InjectionToken } from '@angular/core';

export interface JournalNavigationReturnHandler {
  resolveBackHref(fallback: string): string;
  goBack(fallback: string): void;
}

export const JOURNAL_NAVIGATION_RETURN = new InjectionToken<JournalNavigationReturnHandler>(
  'JOURNAL_NAVIGATION_RETURN'
);
