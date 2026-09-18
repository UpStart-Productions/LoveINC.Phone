import {
  filterNavigableAppLinks,
  resolveAppLinkNavigation,
} from './app-link-navigation.util';
import type { PlatformAppLink } from '../../services/platform/types';

describe('app-link-navigation', () => {
  it('resolves theme and plan routes', () => {
    expect(
      resolveAppLinkNavigation(
        { type: 'microlearning_theme', id: 't1', title: 'Theme' },
        'updates',
      ),
    ).toEqual({
      commands: ['/tabs/content-plan-theme', 't1'],
      queryParams: { from: 'updates' },
    });
    expect(
      resolveAppLinkNavigation(
        { type: 'microlearning_plan', id: 'p1', title: 'Path' },
        'transformation-classes',
      ),
    ).toEqual({
      commands: ['/tabs/content-plan', 'p1'],
      queryParams: { from: 'transformation-classes' },
    });
  });

  it('filters to navigable links only', () => {
    const links: PlatformAppLink[] = [
      { type: 'microlearning_theme', id: 't1', title: 'Theme' },
      { type: 'grov_pod', id: 'g1', title: 'Tool', slug: 'job-search' },
    ];
    expect(filterNavigableAppLinks(links)).toEqual([links[0]]);
  });
});
