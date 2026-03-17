import type { Route } from '@angular/router';

/**
 * Tool card config for the Tools page. Add packages here to have them
 * appear in the app. Each entry with a `route` is navigable.
 */
export interface ToolCard {
  category?: string;
  categoryIcon?: string;
  categoryExtra?: string;
  title: string;
  detail?: string;
  imageUrl?: string;
  iconName?: string;
  iconBackgroundColor?: string;
  /** Route to navigate to (e.g. '/tabs/goal-tracker'). Omit for placeholders. */
  route?: string;
}

/**
 * Route configs for registered tools. Tools with custom tab bars include
 * data: { hideMainTabBar: true } so the main app tab bar is swapped.
 * Add new package routes here when integrating npm packages.
 */
export const REGISTERED_TOOL_ROUTES: Route[] = [
  {
    path: 'goal-tracker',
    data: { hideMainTabBar: true },
    loadComponent: () =>
      import('./goal-tracker-tabs/goal-tracker-tabs.page').then((m) => m.GoalTrackerTabsPage),
    children: [
      {
        path: 'habits',
        loadComponent: () =>
          import('./goal-tracker-tabs/goal-tracker-habits.page').then((m) => m.GoalTrackerHabitsPage),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./goal-tracker-tabs/goal-tracker-statistics.page').then(
            (m) => m.GoalTrackerStatisticsPage
          ),
      },
      {
        path: '',
        redirectTo: 'habits',
        pathMatch: 'full',
      },
    ],
  },
];

/**
 * Tool cards for the Tools page. Includes both implemented tools (with route)
 * and placeholders (no route). Add package tool cards here.
 */
export const REGISTERED_TOOL_CARDS: ToolCard[] = [
  {
    category: 'Money Management',
    categoryIcon: 'wallet-outline',
    title: 'Simple Budget Planner',
    detail: 'Track income and expenses',
    iconName: 'calculator-outline',
    iconBackgroundColor: '#214491',
  },
  {
    category: 'Transformation Classes',
    categoryIcon: 'school-outline',
    title: 'Mentor Match',
    detail: 'Connect mentors and mentees',
    iconName: 'people-circle-outline',
    iconBackgroundColor: '#349394',
  },
  {
    category: 'Life Skills',
    categoryIcon: 'restaurant-outline',
    title: 'Meal Planning Tool',
    detail: 'Plan meals and save money',
    iconName: 'restaurant-outline',
    iconBackgroundColor: '#d56132',
  },
  {
    category: 'Spiritual Growth',
    categoryIcon: 'book-outline',
    title: 'Prayer Journal',
    detail: 'Record prayers and reflections',
    iconName: 'book-outline',
    iconBackgroundColor: '#2c5f7d',
  },
  {
    category: 'Life Skills',
    categoryIcon: 'trophy-outline',
    title: 'Goal Tracker',
    detail: 'Set and track personal goals',
    iconName: 'trophy-outline',
    iconBackgroundColor: '#eaa535',
    route: '/tabs/goal-tracker',
  },
];
