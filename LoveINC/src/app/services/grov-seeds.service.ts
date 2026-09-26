import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import {
  filterToolCardsByEnabledSlugs,
  getAllRegisteredToolSlugs,
  type ToolCard,
} from '../registered-tools';
import { PlatformApiService } from './platform/platform-api.service';
import type { PlatformGrovSeed } from './platform/types';

@Injectable({ providedIn: 'root' })
export class GrovSeedsService {
  private readonly platformApi = inject(PlatformApiService);
  private enabledSlugsCache$: Observable<Set<string>> | null = null;

  getSeeds(refresh = false): Observable<PlatformGrovSeed[] | null> {
    if (refresh) {
      this.enabledSlugsCache$ = null;
    }
    return this.platformApi.getGrovSeeds();
  }

  /** Slugs enabled for this tenant. On API failure, falls back to all registered tools. */
  getEnabledSlugs(refresh = false): Observable<Set<string>> {
    if (refresh) {
      this.enabledSlugsCache$ = null;
    }

    if (!this.enabledSlugsCache$) {
      this.enabledSlugsCache$ = this.platformApi.getGrovSeeds().pipe(
        map((seeds) => {
          if (seeds == null) {
            return new Set(getAllRegisteredToolSlugs());
          }
          return new Set(seeds.map((seed) => seed.slug.trim()).filter(Boolean));
        }),
        shareReplay(1),
      );
    }

    return this.enabledSlugsCache$;
  }

  isSlugEnabled(slug: string, refresh = false): Observable<boolean> {
    const normalized = slug.trim();
    return this.getEnabledSlugs(refresh).pipe(
      map((enabledSlugs) => enabledSlugs.has(normalized)),
    );
  }

  filterToolCards(cards: ToolCard[], refresh = false): Observable<ToolCard[]> {
    return this.getEnabledSlugs(refresh).pipe(
      map((enabledSlugs) => filterToolCardsByEnabledSlugs(cards, enabledSlugs)),
    );
  }
}
