import { ActivatedRouteSnapshot, Router } from '@angular/router';

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
