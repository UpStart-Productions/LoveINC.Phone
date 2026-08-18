import { Router, UrlTree, type NavigationExtras } from '@angular/router';
import { toNavigationTree } from './navigation-tab-prefix.util';

/** Flat tab-shell navigation (no tab-stack prefix) — e.g. Services FAB menu. */
export async function navigateAppFlat(
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

  return router.navigateByUrl(tree, {
    replaceUrl: options?.replaceUrl,
    state: options?.state,
  });
}
