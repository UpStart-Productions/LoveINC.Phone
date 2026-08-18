import type { ActivatedRouteSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import type { NavController } from '@ionic/angular/standalone';
import { resolveReturnUrlFromRouteTree } from './navigation-origin.util';
import { resolveStackParentUrl } from './navigation-tab-prefix.util';

/**
 * Back on the Ionic stack: pop when possible, else same-tab parent, else `from` / fallback.
 */
export async function navigateAppBack(
  navController: NavController,
  router: Router,
  routeSnapshot: ActivatedRouteSnapshot,
  fallback: string
): Promise<void> {
  if (await navController.pop()) {
    return;
  }

  const stackParent = resolveStackParentUrl(router.url);
  if (stackParent) {
    await navController.navigateBack(stackParent);
    return;
  }

  const explicit = resolveReturnUrlFromRouteTree(routeSnapshot);
  await navController.navigateBack(explicit ?? fallback);
}
