import { InjectionToken } from '@angular/core';

export interface NavigationReturnHandler {
  resolveBackHref(fallback: string): string;
  goBack(fallback: string): void;
}

/** Host app provides this so package pages (Verse, Journal) share the same Back behavior. */
export const NAVIGATION_RETURN = new InjectionToken<NavigationReturnHandler>(
  'NAVIGATION_RETURN'
);
