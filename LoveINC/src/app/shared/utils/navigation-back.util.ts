import type { ActivatedRouteSnapshot } from '@angular/router';
import type { NavController } from '@ionic/angular/standalone';
import { resolveReturnUrlFromRouteTree } from './navigation-origin.util';

/**
 * Back navigation: pop Ionic stack when possible, else navigateBack via `from` / fallback.
 */
export async function navigateAppBack(
  navController: NavController,
  routeSnapshot: ActivatedRouteSnapshot,
  fallback: string
): Promise<void> {
  if (await navController.pop()) {
    return;
  }

  const explicit = resolveReturnUrlFromRouteTree(routeSnapshot);
  const target = explicit ?? fallback;
  await navController.navigateBack(target);
}
