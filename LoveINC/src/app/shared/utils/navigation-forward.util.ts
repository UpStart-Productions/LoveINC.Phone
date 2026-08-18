import { Router, UrlTree, type NavigationExtras } from '@angular/router';
import type { NavController } from '@ionic/angular/standalone';
import { applyActiveTabPrefix, toNavigationTree } from './navigation-tab-prefix.util';

/**
 * Forward navigation on the active tab stack (Ionic iOS slide-in).
 * Prefixes flat drill-in URLs with the current tab segment when needed.
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

  const { queryParams, fragment, state, replaceUrl, ...rest } = options ?? {};
  void queryParams;
  void fragment;
  void replaceUrl;

  return navController.navigateForward(tree.toString(), {
    ...rest,
    state,
  });
}
