import {
  findServiceOrOfferingById,
  resolveGapPlatformServices,
} from './gap-services.util';
import type { PlatformService, PlatformServiceCollection } from '../../services/platform/types';

const svc = (id: string, slug: string, title: string): PlatformService => ({
  id,
  slug,
  title,
  items: [],
  offerings: [],
});

describe('resolveGapPlatformServices', () => {
  const all = [
    svc('s1', 'gap-services', 'Gap Services'),
    svc('s2', 'other', 'Other'),
  ];

  it('uses collection serviceIds in order when configured', () => {
    const collections: PlatformServiceCollection[] = [
      {
        id: 'c1',
        slug: 'gap-services',
        title: 'Gap Services',
        sortOrder: 0,
        serviceIds: ['s2', 's1'],
        services: [],
      },
    ];
    const result = resolveGapPlatformServices(collections, all);
    expect(result.map((s) => s.id)).toEqual(['s2', 's1']);
  });

  it('falls back to gap service slug when collection is empty', () => {
    const result = resolveGapPlatformServices([], all);
    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  it('accepts legacy gap-ministries slug', () => {
    const legacy = [svc('s3', 'gap-ministries', 'Gap Ministries')];
    const result = resolveGapPlatformServices([], legacy);
    expect(result.map((s) => s.id)).toEqual(['s3']);
  });

  it('returns empty when nothing matches', () => {
    expect(resolveGapPlatformServices([], [svc('s2', 'other', 'Other')])).toEqual([]);
  });
});

describe('findServiceOrOfferingById', () => {
  it('finds offering by id', () => {
    const services: PlatformService[] = [
      {
        id: 'svc1',
        title: 'Gap',
        items: [],
        offerings: [
          {
            id: 'off1',
            provider: { id: 'p1', name: 'Church' },
            items: ['Food'],
          },
        ],
      },
    ];
    const found = findServiceOrOfferingById(services, 'off1');
    expect(found.item?.id).toBe('off1');
    expect(found.service?.id).toBe('svc1');
  });
});
