import { ActivatedRoute } from '@angular/router';

/** Walks the route tree for a `from` query param (e.g. home, tools, more). */
export function readNavigationOriginHref(route: ActivatedRoute): string | null {
  let current: ActivatedRoute | null = route;
  while (current) {
    const from = current.snapshot.queryParamMap.get('from');
    if (from) {
      return `/tabs/${from}`;
    }
    current = current.parent;
  }
  return null;
}
