import type { ActivatedRouteSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import type { NavController } from '@ionic/angular/standalone';
import { urlContainsMicroApp } from './navigation-micro-app.util';
import { resolveReturnUrlFromRouteTree } from './navigation-origin.util';
import { resolveStackParentUrl } from './navigation-tab-prefix.util';

/**
 * Back navigation: micro-apps return directly to origin; other screens use Ionic stack pop when possible.
 */
export async function navigateAppBack(
  navController: NavController,
  router: Router,
  routeSnapshot: ActivatedRouteSnapshot,
  fallback: string
): Promise<void> {
  const explicit = resolveReturnUrlFromRouteTree(routeSnapshot);
  const destination = explicit ?? fallback;

  if (urlContainsMicroApp(router.url)) {
    await router.navigateByUrl(destination, { replaceUrl: true });
    return;
  }

  if (await navController.pop()) {
    return;
  }

  const stackParent = resolveStackParentUrl(router.url);
  if (stackParent) {
    await navController.navigateBack(stackParent);
    return;
  }

  await navController.navigateBack(destination);
}
