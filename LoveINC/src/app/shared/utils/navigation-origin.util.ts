import type { ActivatedRouteSnapshot, ParamMap } from '@angular/router';

/** Maps `?from=` query values to tab-shell return URLs. */
const FROM_TO_RETURN_URL: Readonly<Record<string, string>> = {
  home: '/tabs/home',
  about: '/tabs/about',
  updates: '/tabs/updates',
  more: '/tabs/more',
  tools: '/tabs/tools',
  'transformation-tools': '/tabs/transformation-tools',
  services: '/tabs/services',
  'impact-stories': '/tabs/impact-stories',
  'volunteer-positions': '/tabs/volunteer-positions',
  'church-partnerships': '/tabs/church-partnerships',
  'gap-ministries': '/tabs/gap-ministries',
  'transformation-classes': '/tabs/transformation-classes',
  profile: '/tabs/profile',
  settings: '/tabs/settings',
};

/**
 * Resolves an explicit back destination from `returnUrl` or `from` query params.
 * Returns null when neither is set (caller may fall back to history.back()).
 */
export function resolveReturnUrl(queryParamMap: ParamMap): string | null {
  const returnUrl = queryParamMap.get('returnUrl');
  if (returnUrl?.startsWith('/')) {
    return returnUrl;
  }
  const from = queryParamMap.get('from');
  if (from && FROM_TO_RETURN_URL[from]) {
    return FROM_TO_RETURN_URL[from];
  }
  return null;
}

/** Walks the route tree for the nearest `from` / `returnUrl` (nested tool routes). */
export function resolveReturnUrlFromRouteTree(
  snapshot: ActivatedRouteSnapshot
): string | null {
  let route: ActivatedRouteSnapshot | null = snapshot;
  while (route) {
    const url = resolveReturnUrl(route.queryParamMap);
    if (url) {
      return url;
    }
    route = route.parent;
  }
  return null;
}
