import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';

/**
 * Returns true if any activated route in the current route tree has
 * `data: { hideMainTabBar: true }`. Used to swap the main app tab bar
 * for a tool's own tab bar (e.g. Goal Tracker).
 */
export function shouldHideMainTabBar(router: Router): boolean {
  function check(snapshot: ActivatedRouteSnapshot): boolean {
    if (snapshot.data['hideMainTabBar']) return true;
    return snapshot.children.some((child) => check(child));
  }
  return check(router.routerState.root.snapshot);
}

/** Walks the route tree for a `from` query param (e.g. home, tools, more). */
export function readNavigationOriginHref(route: ActivatedRoute): string | null {
  let current: ActivatedRoute | null = route;
  while (current) {
    const from = current.snapshot.queryParamMap.get('from');
    if (from) {
      return `/tabs/${from}`;
    }
    current = current.parent;
  }
  return null;
}

export function getNavigationOriginBackHref(
  route: ActivatedRoute,
  defaultHref: string
): string {
  return readNavigationOriginHref(route) ?? defaultHref;
}
