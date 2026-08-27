import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { DonateActionSheetService } from '../../services/donate-action-sheet.service';
import { navigateAppForward } from './navigation-forward.util';
import type { HomeCtaAction } from '../../components/home-cta-row/home-cta-row.model';

export async function executeHomeCtaAction(
  action: HomeCtaAction,
  navController: NavController,
  router: Router,
  donateActionSheetService: DonateActionSheetService
): Promise<void> {
  switch (action.kind) {
    case 'route':
      await navigateAppForward(navController, router, action.path, {
        queryParams: action.queryParams,
      });
      break;
    case 'content-detail':
      await navigateAppForward(
        navController,
        router,
        ['/tabs/content-detail', action.contentType, action.id],
        { queryParams: { from: 'home' } }
      );
      break;
    case 'donate-sheet':
      await donateActionSheetService.openDonateActionSheet();
      break;
    case 'get-help':
      if (action.target === 'connection-center') {
        await navigateAppForward(navController, router, ['/tabs/connection-center'], {
          queryParams: { from: 'home' },
        });
      } else if (action.target === 'profile') {
        await navigateAppForward(navController, router, ['/tabs/profile'], {
          queryParams: { from: 'home' },
        });
      } else if (action.target === 'gap-ministries') {
        await navigateAppForward(navController, router, ['/tabs/gap-ministries'], {
          queryParams: { from: 'home' },
        });
      } else {
        await navigateAppForward(navController, router, ['/tabs/services'], {
          queryParams: { from: 'home' },
        });
      }
      break;
  }
}
