import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { PlatformApiService } from '../services/platform/platform-api.service';
import { mapPlatformPlanToContentPlan } from './content-plan.mapper';
import type { ContentPlan } from './content-plan.model';

@Injectable({ providedIn: 'root' })
export class ContentPlanService {
  private readonly platformApi = inject(PlatformApiService);
  private plansCache$: Observable<ContentPlan[]> | null = null;

  getPlans(refresh = false): Observable<ContentPlan[]> {
    if (refresh) {
      this.plansCache$ = null;
    }

    if (!this.plansCache$) {
      this.plansCache$ = this.platformApi.getPlans().pipe(
        map((plans) =>
          plans.map((plan) =>
            mapPlatformPlanToContentPlan(plan, (path) =>
              this.platformApi.resolveUploadUrl(path)
            )
          )
        ),
        shareReplay(1)
      );
    }

    return this.plansCache$;
  }

  getPlan(planKey: string, refresh = false): Observable<ContentPlan | null> {
    const key = planKey.trim();
    return this.getPlans(refresh).pipe(
      map(
        (plans) =>
          plans.find((plan) => plan.id === key || plan.slug === key) ?? null
      )
    );
  }

  getMoment(
    planKey: string,
    momentId: string,
    refresh = false
  ): Observable<{ plan: ContentPlan; moment: ContentPlan['moments'][number] } | null> {
    return this.getPlan(planKey, refresh).pipe(
      map((plan) => {
        if (!plan) return null;
        const moment = plan.moments.find((row) => row.id === momentId) ?? null;
        if (!moment) return null;
        return { plan, moment };
      })
    );
  }
}
