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
        loadComponent: () =>
          import('@app/simple-budget-tabs/simple-budget-export.page').then(
            (m) => m.SimpleBudgetExportPage
          ),
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
    category: 'Spiritual Growth',
    lucideCategoryIcon: 'compass',
    title: 'Tools for Transformation',
    detail: 'Guided devotionals for growth',
    lucideIcon: 'compass',
    iconBackgroundColor: '#349394',
    route: '/tabs/transformation-tools',
  },
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
  // {
  //   category: 'Transformation Classes',
  //   categoryIcon: 'school-outline',
  //   title: 'Mentor Match',
  //   detail: 'Connect mentors and mentees',
  //   iconName: 'people-circle-outline',
  //   iconBackgroundColor: '#349394',
  // },
  // {
  //   category: 'Life Skills',
  //   categoryIcon: 'restaurant-outline',
  //   title: 'Meal Planning Tool',
  //   detail: 'Plan meals and save money',
  //   iconName: 'restaurant-outline',
  //   iconBackgroundColor: '#d56132',
  // },
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
