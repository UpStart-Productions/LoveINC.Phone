import type { PlatformJobListing } from '../services/platform/types';
import {
  companyDistanceMiles,
  formatDistanceMiles,
  groupJobsByCompany,
  isUsableOrigin,
  mapCompanyToListItem,
  sortCompanyGroups,
  sortJobsByDistance,
} from './job-listing.mapper';

function job(partial: Partial<PlatformJobListing> & Pick<PlatformJobListing, 'id' | 'companyName'>): PlatformJobListing {
  return {
    title: 'Role',
    locations: [],
    tags: [],
    salaryIsPredicted: false,
    applyUrl: 'https://example.com',
    postedAt: '2026-09-01T00:00:00.000Z',
    ...partial,
  };
}

const origin = { latitude: 45.3, longitude: -122.97 };

describe('job distance sort', () => {
  it('treats an origin as usable only when both coords are finite', () => {
    expect(isUsableOrigin({ latitude: 45, longitude: -123 })).toBe(true);
    expect(isUsableOrigin({ latitude: null, longitude: -123 })).toBe(false);
    expect(isUsableOrigin(null)).toBe(false);
  });

  it('sorts jobs nearest first and puts missing pins last', () => {
    const near = job({ id: 'near', companyName: 'A', latitude: 45.31, longitude: -122.97 });
    const far = job({ id: 'far', companyName: 'A', latitude: 45.5, longitude: -122.97 });
    const unknown = job({ id: 'unk', companyName: 'A' });
    expect(sortJobsByDistance([unknown, far, near], origin).map((j) => j.id)).toEqual([
      'near',
      'far',
      'unk',
    ]);
  });

  it('sorts companies by nearest job when sort is distance', () => {
    const groups = groupJobsByCompany([
      job({ id: '1', companyName: 'Far Co', latitude: 46, longitude: -122.97 }),
      job({ id: '2', companyName: 'Near Co', latitude: 45.31, longitude: -122.97 }),
    ]);
    expect(sortCompanyGroups(groups, 'distance', origin).map((g) => g.companyName)).toEqual([
      'Near Co',
      'Far Co',
    ]);
  });

  it('formats miles with one decimal under 10 and whole miles after', () => {
    expect(formatDistanceMiles(0.04)).toBe('< 0.1 mi');
    expect(formatDistanceMiles(2.41)).toBe('2.4 mi');
    expect(formatDistanceMiles(12.4)).toBe('12 mi');
  });

  it('puts the closest job distance on the company list card', () => {
    const near = job({ id: 'near', companyName: 'Acme', latitude: 45.31, longitude: -122.97 });
    const far = job({ id: 'far', companyName: 'Acme', latitude: 46, longitude: -122.97 });
    const groups = groupJobsByCompany([far, near]);
    const closest = formatDistanceMiles(companyDistanceMiles([far, near], origin)!);
    expect(mapCompanyToListItem(groups[0], origin).detail).toBe(`2 jobs · ${closest}`);
    expect(closest).toBe(formatDistanceMiles(companyDistanceMiles([near], origin)!));
  });

  it('omits distance when there is no origin or no job pins', () => {
    const groups = groupJobsByCompany([job({ id: '1', companyName: 'Acme' })]);
    expect(mapCompanyToListItem(groups[0]).detail).toBe('1 job');
    expect(mapCompanyToListItem(groups[0], origin).detail).toBe('1 job');
  });
});
