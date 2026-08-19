import type { UrlTree } from '@angular/router';

/** Full-screen tools that use flat router navigation instead of Ionic tab-stack push/pop. */
export const MICRO_APP_ROOT_SEGMENTS = ['goal-tracker', 'simple-budget'] as const;

export function urlContainsMicroApp(url: string): boolean {
  const segments = url.split('?')[0].split('/').filter(Boolean);
  return segments.some((segment) =>
    (MICRO_APP_ROOT_SEGMENTS as readonly string[]).includes(segment)
  );
}

export function treeContainsMicroApp(tree: UrlTree): boolean {
  const segments = tree.root.children['primary']?.segments.map((segment) => segment.path) ?? [];
  return segments.some((segment) =>
    (MICRO_APP_ROOT_SEGMENTS as readonly string[]).includes(segment)
  );
}
