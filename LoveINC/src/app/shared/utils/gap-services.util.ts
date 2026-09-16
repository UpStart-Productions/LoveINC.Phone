import type {
  PlatformOffering,
  PlatformService,
  PlatformServiceCollection,
} from '../../services/platform/types';

/** Collection slugs used for the Gap Ministries hub (prod: gap-services). */
export const GAP_COLLECTION_SLUGS = ['gap-services', 'gap-ministries'];

/** Service slugs when no collection is configured yet. */
export const GAP_SERVICE_SLUGS = ['gap-services', 'gap-ministries'];

/**
 * Resolve which platform services power the Gap Ministries list.
 * Prefer service-collections when present; fall back to slug match on /services.
 */
export function resolveGapPlatformServices(
  collections: PlatformServiceCollection[],
  allServices: PlatformService[],
): PlatformService[] {
  const active = allServices ?? [];

  const collection = (collections ?? []).find((c) =>
    GAP_COLLECTION_SLUGS.includes(c.slug),
  );
  if (collection?.serviceIds?.length) {
    const byId = new Map(active.map((s) => [s.id, s]));
    const ordered = collection.serviceIds
      .map((id) => byId.get(id))
      .filter((s): s is PlatformService => s != null);
    if (ordered.length > 0) return ordered;
  }

  const bySlug = active.filter(
    (s) => s.slug != null && GAP_SERVICE_SLUGS.includes(s.slug),
  );
  return bySlug;
}

export function findServiceOrOfferingById(
  services: PlatformService[],
  id: string,
): {
  item: PlatformOffering | PlatformService | null;
  service: PlatformService | null;
} {
  for (const svc of services ?? []) {
    if (svc.id === id) {
      return { item: svc, service: svc };
    }
    for (const off of svc.offerings ?? []) {
      if (off.id === id) {
        return { item: off, service: svc };
      }
    }
  }
  return { item: null, service: null };
}

/** Assistance labels on a service (for standalone cards without offerings). */
export function serviceAssistanceLabels(svc: PlatformService): string[] {
  return (svc.items ?? []).map((i) => i.label).filter(Boolean);
}
