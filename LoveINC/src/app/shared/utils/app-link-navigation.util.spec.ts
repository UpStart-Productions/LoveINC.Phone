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

  it('resolves grov pod routes by slug', () => {
    expect(
      resolveAppLinkNavigation(
        { type: 'grov_pod', id: 'g1', title: 'Job Search', slug: 'job-search' },
        'updates',
      ),
    ).toEqual({
      commands: ['/tabs/job-search'],
      queryParams: { from: 'updates' },
    });
    expect(
      resolveAppLinkNavigation(
        { type: 'grov_pod', id: 'g2', title: 'Unknown', slug: 'not-a-tool' },
        'home',
      ),
    ).toBeNull();
  });

  it('resolves collection routes', () => {
    expect(
      resolveAppLinkNavigation(
        {
          type: 'collection',
          id: 'theme1',
          title: 'Theme collection',
          collectionContentType: 'theme',
        },
        'impact-stories',
      ),
    ).toEqual({
      commands: ['/tabs/content-plan-theme', 'theme1'],
      queryParams: { from: 'impact-stories' },
    });
    expect(
      resolveAppLinkNavigation(
        {
          type: 'collection',
          id: 'col1',
          title: 'Services hub',
          collectionContentType: 'service',
        },
        'updates',
      ),
    ).toEqual({
      commands: ['/tabs/collection', 'col1'],
      queryParams: { from: 'updates' },
    });
  });

  it('resolves event, class, and impact story routes', () => {
    expect(
      resolveAppLinkNavigation(
        { type: 'event', id: 'e1', title: 'Community Dinner' },
        'updates',
      ),
    ).toEqual({
      commands: ['/tabs/content-detail/event', 'e1'],
      queryParams: { from: 'updates' },
    });
    expect(
      resolveAppLinkNavigation(
        { type: 'class', id: 'c1', title: 'Budget Basics' },
        'transformation-classes',
      ),
    ).toEqual({
      commands: ['/tabs/content-detail/class', 'c1'],
      queryParams: { from: 'transformation-classes' },
    });
    expect(
      resolveAppLinkNavigation(
        { type: 'impact_story', id: 's1', title: 'A new start' },
        'impact-stories',
      ),
    ).toEqual({
      commands: ['/tabs/content-detail/impact-story', 's1'],
      queryParams: { from: 'impact-stories' },
    });
  });

  it('filters to navigable links only', () => {
    const links: PlatformAppLink[] = [
      { type: 'microlearning_theme', id: 't1', title: 'Theme' },
      { type: 'grov_pod', id: 'g1', title: 'Tool', slug: 'job-search' },
      { type: 'grov_pod', id: 'g2', title: 'Missing', slug: 'unknown-tool' },
    ];
    expect(filterNavigableAppLinks(links)).toEqual([links[0], links[1]]);
  });
});
