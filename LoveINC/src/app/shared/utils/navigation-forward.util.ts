import { Router, UrlTree, type NavigationExtras } from '@angular/router';
import type { NavController } from '@ionic/angular/standalone';
import { treeContainsMicroApp } from './navigation-micro-app.util';
import { applyActiveTabPrefix, toNavigationTree } from './navigation-tab-prefix.util';

/**
 * Forward navigation on the active tab stack (Ionic iOS slide-in).
 * Micro-apps (Goal Tracker, Budget Planner) use flat router navigation instead.
 */
export async function navigateAppForward(
  navController: NavController,
  router: Router,
  target: string | UrlTree | readonly unknown[],
  options?: NavigationExtras
): Promise<boolean> {
  let tree = toNavigationTree(router, target);

  if (options?.queryParams) {
    tree.queryParams = {
      ...tree.queryParams,
      ...(options.queryParams as Record<string, string>),
    };
  }

  tree = applyActiveTabPrefix(router, tree);

  const { queryParams, fragment, replaceUrl, state, ...rest } = options ?? {};
  void queryParams;
  void fragment;
  void replaceUrl;

  const url = router.serializeUrl(tree);

  if (treeContainsMicroApp(tree)) {
    return router.navigateByUrl(url, { state });
  }

  return navController.navigateForward(url, {
    ...rest,
    state,
  });
}
