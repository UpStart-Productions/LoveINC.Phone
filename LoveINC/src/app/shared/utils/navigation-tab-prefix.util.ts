import { Router, UrlTree } from '@angular/router';

/** Primary tab segments (ion-tab-button href targets). */
export const MAIN_TAB_SEGMENTS = [
  'home',
  'updates',
  'impact-stories',
  'tools',
  'more',
] as const;

export type MainTabSegment = (typeof MAIN_TAB_SEGMENTS)[number];

/**
 * Routes that already live at `/tabs/{segment}` and must never be rewritten
 * (e.g. About at `/tabs/about`, not `/tabs/more/about`).
 */
export const FLAT_TAB_SHELL_SEGMENTS = new Set<string>([
  'about',
  ...MAIN_TAB_SEGMENTS,
]);

function isUrlTree(value: unknown): value is UrlTree {
  return !!value && typeof value === 'object' && 'root' in value;
}

function primaryPathSegments(tree: UrlTree): string[] {
  return tree.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
}

export function isMainTabSegment(segment: string | undefined): segment is MainTabSegment {
  return !!segment && (MAIN_TAB_SEGMENTS as readonly string[]).includes(segment);
}

function isFlatTabShellSegment(segment: string | undefined): boolean {
  return !!segment && FLAT_TAB_SHELL_SEGMENTS.has(segment);
}

/** Active main tab from the current URL (e.g. `/tabs/home/foo` → `home`). */
export function resolveActiveMainTabSegment(router: Router): MainTabSegment {
  const segments = primaryPathSegments(router.parseUrl(router.url));
  if (segments[0] !== 'tabs') {
    return 'home';
  }
  const second = segments[1];
  if (isMainTabSegment(second)) {
    return second;
  }
  return 'home';
}

export function toNavigationTree(
  router: Router,
  target: string | UrlTree | readonly unknown[]
): UrlTree {
  if (isUrlTree(target)) {
    return target;
  }
  if (typeof target === 'string') {
    return router.parseUrl(target);
  }
  return router.createUrlTree(target as string[]);
}

/**
 * Rewrites `/tabs/drill-in` → `/tabs/{activeTab}/drill-in` so Ionic keeps the
 * page on the current tab stack (standard tabs + child-route pattern).
 */
export function applyActiveTabPrefix(router: Router, tree: UrlTree): UrlTree {
  const segments = primaryPathSegments(tree);
  if (segments[0] !== 'tabs' || segments.length < 2) {
    return tree;
  }

  const second = segments[1];
  if (isMainTabSegment(second) || isFlatTabShellSegment(second)) {
    return tree;
  }

  const tab = resolveActiveMainTabSegment(router);
  const prefixed = router.createUrlTree(['/tabs', tab, ...segments.slice(1)], {
    queryParams: tree.queryParams,
    fragment: tree.fragment ?? undefined,
  });
  return prefixed;
}

/** Parent tab root for a tab-prefixed drill-in (e.g. `/tabs/home/foo` → `/tabs/home`). */
export function resolveStackParentUrl(url: string): string | null {
  const path = url.split('?')[0];
  const segments = path.split('/').filter(Boolean);
  if (segments[0] !== 'tabs' || segments.length < 3) {
    return null;
  }
  const tab = segments[1];
  if (!isMainTabSegment(tab)) {
    return null;
  }
  return `/tabs/${tab}`;
}
