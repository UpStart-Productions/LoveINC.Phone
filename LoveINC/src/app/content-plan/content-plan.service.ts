import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { PlatformApiService } from '../services/platform/platform-api.service';
import {
  mapPlatformPlanToContentPlan,
  mapPlatformTheme,
  normalizePlanThemeKey,
  sortContentPlansByOrder,
} from './content-plan.mapper';
import type { ContentPlan, ContentPlanTheme } from './content-plan.model';

@Injectable({ providedIn: 'root' })
export class ContentPlanService {
  private readonly platformApi = inject(PlatformApiService);
  private plansCache$: Observable<ContentPlan[]> | null = null;
  private themesCache$: Observable<ContentPlanTheme[]> | null = null;

  getPlans(refresh = false): Observable<ContentPlan[]> {
    if (refresh) {
      this.plansCache$ = null;
    }

    if (!this.plansCache$) {
      this.plansCache$ = this.platformApi.getPlans().pipe(
        map((plans) =>
          sortContentPlansByOrder(
            plans.map((plan) =>
              mapPlatformPlanToContentPlan(plan, (path) =>
                this.platformApi.resolveUploadUrl(path)
              )
            )
          )
        ),
        shareReplay(1)
      );
    }

    return this.plansCache$;
  }

  getThemes(refresh = false): Observable<ContentPlanTheme[]> {
    if (refresh) {
      this.themesCache$ = null;
    }

    if (!this.themesCache$) {
      this.themesCache$ = this.platformApi.getThemes().pipe(
        map((themes) =>
          themes
            .map((theme) => mapPlatformTheme(theme))
            .filter((theme) => theme.isActive)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        ),
        shareReplay(1)
      );
    }

    return this.themesCache$;
  }

  getThemeById(themeId: string, refresh = false): Observable<ContentPlanTheme | null> {
    const id = themeId.trim();
    if (!id) {
      return this.getThemes(refresh).pipe(map(() => null));
    }

    return this.getThemes(refresh).pipe(
      map((themes) => themes.find((theme) => theme.id === id) ?? null)
    );
  }

  getThemeByName(themeName: string, refresh = false): Observable<ContentPlanTheme | null> {
    const themeKey = normalizePlanThemeKey(themeName);
    if (!themeKey) {
      return this.getThemes(refresh).pipe(map(() => null));
    }

    return this.getThemes(refresh).pipe(
      map(
        (themes) =>
          themes.find((theme) => normalizePlanThemeKey(theme.name) === themeKey) ?? null
      )
    );
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

  getPlansByThemeName(themeName: string, refresh = false): Observable<ContentPlan[]> {
    return this.getPlansByTheme({ name: themeName }, refresh);
  }

  getPlansByThemeId(themeId: string, refresh = false): Observable<ContentPlan[]> {
    return this.getPlansByTheme({ id: themeId }, refresh);
  }

  getPlansByTheme(
    ref: { id?: string; name?: string },
    refresh = false
  ): Observable<ContentPlan[]> {
    const themeId = ref.id?.trim();
    const themeKey = ref.name ? normalizePlanThemeKey(ref.name) : '';

    if (!themeId && !themeKey) {
      return this.getPlans(refresh).pipe(map(() => []));
    }

    return this.getPlans(refresh).pipe(
      map((plans) =>
        plans.filter((plan) => {
          if (!plan.theme.isActive) {
            return false;
          }
          if (themeId) {
            return plan.theme.id === themeId;
          }
          return normalizePlanThemeKey(plan.theme.name) === themeKey;
        })
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
