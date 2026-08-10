import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import type { NavigationReturnHandler } from './navigation-return.token';

const MAIN_TAB_PATHS = new Set([
  '/tabs/home',
  '/tabs/about',
  '/tabs/updates',
  '/tabs/more',
]);

function normalizePath(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function pathDepth(url: string): number {
  return normalizePath(url).split('/').filter(Boolean).length;
}

function isMainTab(path: string): boolean {
  return MAIN_TAB_PATHS.has(normalizePath(path));
}

function isTabLanding(path: string): boolean {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  return parts.length === 2 && parts[0] === 'tabs';
}

/**
 * Tracks where the user came from so Back returns to the correct screen.
 * Leaving Home for any route sets return to Home; same pattern for Tools, More, etc.
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationReturnService implements NavigationReturnHandler {
  private returnHref: string | null = null;
  private currentPath = '/tabs/home';

  constructor(private readonly router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentPath = normalizePath(e.urlAfterRedirects);
        if (this.returnHref && this.currentPath === normalizePath(this.returnHref)) {
          this.returnHref = null;
        }
      });

    this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe((e) => {
        const from = normalizePath(this.router.url);
        const to = normalizePath(e.url);
        this.handleNavigationStart(from, to);
      });
  }

  resolveBackHref(fallback: string): string {
    return this.pickBackTarget(fallback);
  }

  goBack(fallback: string): void {
    const target = this.pickBackTarget(fallback);
    if (normalizePath(target) === this.currentPath) {
      return;
    }
    void this.router.navigateByUrl(target);
  }

  private pickBackTarget(fallback: string): string {
    const current = this.currentPath;
    if (this.returnHref && normalizePath(this.returnHref) !== current) {
      return this.returnHref;
    }
    if (normalizePath(fallback) !== current) {
      return fallback;
    }
    return fallback;
  }

  private handleNavigationStart(from: string, to: string): void {
    if (from === to) {
      return;
    }

    if (to === '/tabs/home') {
      this.returnHref = null;
      return;
    }

    if (from === '/tabs/home') {
      this.returnHref = '/tabs/home';
      return;
    }

    if (isMainTab(from) && isTabLanding(to) && from !== to) {
      this.returnHref = from;
      return;
    }

    if (isMainTab(from) && isMainTab(to)) {
      this.returnHref = null;
      return;
    }

    if (isTabLanding(from) && pathDepth(to) > pathDepth(from)) {
      this.returnHref = from;
      return;
    }

    if (isTabLanding(from) && isTabLanding(to) && from !== to) {
      this.returnHref = from;
    }
  }
}
