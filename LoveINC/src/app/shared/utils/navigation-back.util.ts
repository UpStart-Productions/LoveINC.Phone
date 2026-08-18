import type { ActivatedRouteSnapshot } from '@angular/router';
import type { NavController } from '@ionic/angular/standalone';
import { resolveReturnUrlFromRouteTree } from './navigation-origin.util';

/**
 * Preferred back navigation for Ionic stack routes:
 * 1. Pop the active ion-router-outlet stack when possible.
 * 2. Otherwise navigate back to `returnUrl` / `from` or the caller fallback.
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
