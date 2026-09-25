import type { Route } from '@angular/router';

/**
 * Tool card config for the Tools page. Add packages here to have them
 * appear in the app. Each entry with a `route` is navigable.
 */
export interface ToolCard {
  category?: string;
  categoryIcon?: string;
  lucideCategoryIcon?: string;
  categoryExtra?: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  iconName?: string;
  lucideIcon?: string;
  iconBackgroundColor?: string;
  /** Route to navigate to (e.g. '/tabs/goal-tracker'). Omit for placeholders. */
  route?: string;
}

/**
 * Route configs for registered tools under the tab shell.
 * Tools with custom tab bars set hideMainTabBar so the main app tab bar is swapped.
 */
export const REGISTERED_TOOL_ROUTES: Route[] = [
  {
    path: 'simple-budget',
    data: { hideMainTabBar: true },
    loadComponent: () =>
      import('@app/simple-budget-tabs/simple-budget-tabs.page').then((m) => m.SimpleBudgetTabsPage),
    children: [
      {
        path: 'weekly',
        loadComponent: () =>
          import('@app/simple-budget-tabs/simple-budget-weekly.page').then(
            (m) => m.SimpleBudgetWeeklyPage
          ),
      },
      {
        path: 'review',
        loadComponent: () =>
          import('@app/simple-budget-tabs/simple-budget-review.page').then(
            (m) => m.SimpleBudgetReviewPage
          ),
      },
      {
        path: 'export',
        redirectTo: 'reports',
        pathMatch: 'full',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('@app/simple-budget-tabs/simple-budget-reports.page').then(
            (m) => m.SimpleBudgetReportsPage
          ),
      },
      {
        path: '',
        redirectTo: 'weekly',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'meal-planner',
    data: { hideMainTabBar: true },
    loadComponent: () =>
      import('@app/meal-planner-tabs/meal-planner-tabs.page').then((m) => m.MealPlannerTabsPage),
    children: [
      {
        path: 'plan',
        loadComponent: () =>
          import('@app/meal-planner-tabs/meal-planner-plan.page').then((m) => m.MealPlannerPlanPage),
      },
      {
        path: 'grocery',
        loadComponent: () =>
          import('@app/meal-planner-tabs/meal-planner-grocery.page').then(
            (m) => m.MealPlannerGroceryPage
          ),
      },
      {
        path: 'cook',
        loadComponent: () =>
          import('@app/meal-planner-tabs/meal-planner-cook.page').then((m) => m.MealPlannerCookPage),
      },
      {
        path: 'summary',
        loadComponent: () =>
          import('@app/meal-planner-tabs/meal-planner-summary.page').then(
            (m) => m.MealPlannerSummaryPage
          ),
      },
      {
        path: '',
        redirectTo: 'plan',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'goal-tracker',
    data: { hideMainTabBar: true },
    loadComponent: () =>
      import('@app/goal-tracker-tabs/goal-tracker-tabs.page').then((m) => m.GoalTrackerTabsPage),
    children: [
      {
        path: 'goals',
        loadComponent: () =>
          import('@app/goal-tracker-tabs/goal-tracker-goals.page').then((m) => m.GoalTrackerGoalsPage),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('@app/goal-tracker-tabs/goal-tracker-statistics.page').then(
            (m) => m.GoalTrackerStatisticsPage
          ),
      },
      {
        path: '',
        redirectTo: 'goals',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'job-search/saved',
    loadComponent: () =>
      import('./job-search/job-search.page').then((m) => m.JobSearchSavedPage),
  },
  {
    path: 'job-search/company/:companyKey',
    loadComponent: () =>
      import('./job-search/job-search.page').then((m) => m.JobSearchCompanyPage),
  },
  {
    path: 'job-search',
    loadComponent: () =>
      import('./job-search/job-search.page').then((m) => m.JobSearchPage),
  },
  {
    path: 'journal',
    loadComponent: () =>
      import('@upstart-productions/journal').then((m) => m.JournalListPage),
  },
  {
    path: 'journal/new',
    loadComponent: () =>
      import('@upstart-productions/journal').then((m) => m.JournalEntryPage),
  },
  {
    path: 'journal/:id',
    loadComponent: () =>
      import('@upstart-productions/journal').then((m) => m.JournalEntryPage),
  },
];

/**
 * Tool cards for the Tools page. Includes both implemented tools (with route)
 * and placeholders (no route). Add package tool cards here.
 */
export const REGISTERED_TOOL_CARDS: ToolCard[] = [
  {
    category: 'Daily Scripture',
    lucideCategoryIcon: 'bookmark',
    title: 'Verse of the Day',
    detail: 'Daily scripture for reflection',
    lucideIcon: 'bookmark',
    iconBackgroundColor: '#3B82F6',
    route: '/tabs/verse-of-the-day',
  },
  {
    category: 'Money Management',
    lucideCategoryIcon: 'wallet',
    title: 'Budget Planner',
    detail: 'Track income and expenses',
    lucideIcon: 'calculator',
    iconBackgroundColor: '#214491',
    route: '/tabs/simple-budget',
  },
  {
    category: 'Life Skills',
    lucideCategoryIcon: 'trophy',
    title: 'Goal Tracker',
    detail: 'Set and track personal goals',
    lucideIcon: 'trophy',
    iconBackgroundColor: '#eaa535',
    route: '/tabs/goal-tracker',
  },
  {
    category: 'Employment',
    lucideCategoryIcon: 'briefcase',
    title: 'Job Search',
    detail: 'Local jobs near you',
    lucideIcon: 'briefcase',
    iconBackgroundColor: '#349394',
    route: '/tabs/job-search',
  },
  // {
  //   category: 'Transformation Classes',
  //   categoryIcon: 'school-outline',
  //   title: 'Mentor Match',
  //   detail: 'Connect mentors and mentees',
  //   iconName: 'people-circle-outline',
  //   iconBackgroundColor: '#349394',
  // },
  {
    category: 'Life Skills',
    lucideCategoryIcon: 'utensils-crossed',
    title: 'Meal Planner',
    detail: 'Plan meals, shop, and cook',
    lucideIcon: 'utensils-crossed',
    iconBackgroundColor: '#d56132',
    route: '/tabs/meal-planner',
  },
  {
    category: 'Personal Growth',
    lucideCategoryIcon: 'sprout',
    title: 'Your Journal',
    detail: 'Capture personal reflections',
    lucideIcon: 'sprout',
    iconBackgroundColor: '#2c5f7d',
    route: '/tabs/journal',
  },
];

function buildNavigableGrovPodSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const route of REGISTERED_TOOL_ROUTES) {
    const path = route.path?.trim();
    if (path) {
      slugs.add(path.split('/')[0]);
    }
  }
  for (const card of REGISTERED_TOOL_CARDS) {
    const route = card.route?.trim();
    if (!route) continue;
    const match = route.match(/^\/tabs\/([^/]+)/);
    if (match?.[1]) {
      slugs.add(match[1]);
    }
  }
  return slugs;
}

const NAVIGABLE_GROV_POD_SLUGS = buildNavigableGrovPodSlugs();

/** Map a GrovPod slug from the platform API to a tab route, or null when unknown. */
export function resolveRegisteredToolTabRoute(slug: string | undefined): string | null {
  const normalized = slug?.trim();
  if (!normalized || !NAVIGABLE_GROV_POD_SLUGS.has(normalized)) {
    return null;
  }
  return `/tabs/${normalized}`;
}
