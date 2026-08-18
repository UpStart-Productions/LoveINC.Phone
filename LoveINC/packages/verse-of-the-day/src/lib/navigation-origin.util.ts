import type { ActivatedRouteSnapshot, ParamMap } from '@angular/router';

const FROM_TO_RETURN_URL: Readonly<Record<string, string>> = {
  home: '/tabs/home',
  about: '/tabs/more',
  updates: '/tabs/updates',
  more: '/tabs/more',
  tools: '/tabs/tools',
  services: '/tabs/services',
};

function resolveReturnUrl(queryParamMap: ParamMap): string | null {
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
