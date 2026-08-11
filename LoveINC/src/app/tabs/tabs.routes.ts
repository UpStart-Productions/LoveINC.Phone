import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { REGISTERED_TOOL_ROUTES } from '../registered-tools';

/** Keep bare root URLs working after moving drill-ins back under `/tabs`. */
const ROOT_DRILL_IN_REDIRECTS: Routes = [
  { path: 'staff', redirectTo: '/tabs/staff', pathMatch: 'full' },
  { path: 'contact', redirectTo: '/tabs/contact', pathMatch: 'full' },
  { path: 'faq', redirectTo: '/tabs/faq', pathMatch: 'full' },
  { path: 'impact-stories', redirectTo: '/tabs/impact-stories', pathMatch: 'full' },
  { path: 'volunteer-positions', redirectTo: '/tabs/volunteer-positions', pathMatch: 'full' },
  {
    path: 'volunteer-position/:id',
    redirectTo: '/tabs/content-detail/volunteer-position/:id',
    pathMatch: 'full',
  },
  { path: 'verse-of-the-day', redirectTo: '/tabs/verse-of-the-day', pathMatch: 'full' },
  { path: 'videos', redirectTo: '/tabs/videos', pathMatch: 'full' },
  { path: 'tools', redirectTo: '/tabs/tools', pathMatch: 'full' },
  { path: 'transformation-tools', redirectTo: '/tabs/transformation-tools', pathMatch: 'full' },
  {
    path: 'transformation-tools/:id',
    redirectTo: '/tabs/transformation-tools/:id',
    pathMatch: 'full',
  },
  { path: 'simple-budget', redirectTo: '/tabs/simple-budget', pathMatch: 'full' },
  { path: 'simple-budget/weekly', redirectTo: '/tabs/simple-budget/weekly', pathMatch: 'full' },
  { path: 'simple-budget/review', redirectTo: '/tabs/simple-budget/review', pathMatch: 'full' },
  { path: 'simple-budget/export', redirectTo: '/tabs/simple-budget/export', pathMatch: 'full' },
  { path: 'simple-budget/reports', redirectTo: '/tabs/simple-budget/reports', pathMatch: 'full' },
  { path: 'goal-tracker', redirectTo: '/tabs/goal-tracker', pathMatch: 'full' },
  { path: 'goal-tracker/goals', redirectTo: '/tabs/goal-tracker/goals', pathMatch: 'full' },
  { path: 'goal-tracker/statistics', redirectTo: '/tabs/goal-tracker/statistics', pathMatch: 'full' },
  { path: 'journal', redirectTo: '/tabs/journal', pathMatch: 'full' },
  { path: 'journal/new', redirectTo: '/tabs/journal/new', pathMatch: 'full' },
  { path: 'journal/:id', redirectTo: '/tabs/journal/:id', pathMatch: 'full' },
  { path: 'saved-items', redirectTo: '/tabs/saved-items', pathMatch: 'full' },
  { path: 'church-partnerships', redirectTo: '/tabs/church-partnerships', pathMatch: 'full' },
  {
    path: 'partner/:id',
    redirectTo: '/tabs/content-detail/partner/:id',
    pathMatch: 'full',
  },
  { path: 'profile', redirectTo: '/tabs/profile', pathMatch: 'full' },
  { path: 'service-unlock/scan', redirectTo: '/tabs/service-unlock/scan', pathMatch: 'full' },
  { path: 'church-map', redirectTo: '/tabs/church-map', pathMatch: 'full' },
  { path: 'connection-center', redirectTo: '/tabs/connection-center', pathMatch: 'full' },
  { path: 'jobs-program', redirectTo: '/tabs/jobs-program', pathMatch: 'full' },
  { path: 'hesed-house', redirectTo: '/tabs/hesed-house', pathMatch: 'full' },
  { path: 'prayer-request', redirectTo: '/tabs/prayer-request', pathMatch: 'full' },
  { path: 'gap-ministries', redirectTo: '/tabs/gap-ministries', pathMatch: 'full' },
  { path: 'transformation-classes', redirectTo: '/tabs/transformation-classes', pathMatch: 'full' },
  {
    path: 'transformation-classes/:id',
    redirectTo: '/tabs/content-detail/class/:id',
    pathMatch: 'full',
  },
  {
    path: 'class-registration/:classId',
    redirectTo: '/tabs/class-registration/:classId',
    pathMatch: 'full',
  },
  {
    path: 'content-detail/:type/:id',
    redirectTo: '/tabs/content-detail/:type/:id',
    pathMatch: 'full',
  },
  { path: 'donate-goods', redirectTo: '/tabs/donate-goods', pathMatch: 'full' },
  { path: 'donate-money', redirectTo: '/tabs/donate-money', pathMatch: 'full' },
  { path: 'developer-options', redirectTo: '/tabs/developer-options', pathMatch: 'full' },
  { path: 'services', redirectTo: '/tabs/services', pathMatch: 'full' },
];

const TAB_DRILL_IN_ROUTES: Routes = [
  {
    path: 'staff',
    loadComponent: () => import('../staff/staff.page').then((m) => m.StaffPage),
  },
  {
    path: 'contact',
    loadComponent: () => import('../contact/contact.page').then((m) => m.ContactPage),
  },
  {
    path: 'faq',
    loadComponent: () => import('../faq/faq.page').then((m) => m.FaqPage),
  },
  {
    path: 'impact-stories',
    loadComponent: () =>
      import('../impact-stories/impact-stories.page').then((m) => m.ImpactStoriesPage),
  },
  {
    path: 'volunteer-positions',
    loadComponent: () =>
      import('../volunteer-positions/volunteer-positions.page').then((m) => m.VolunteerPositionsPage),
  },
  {
    path: 'volunteer-position/:id',
    redirectTo: 'content-detail/volunteer-position/:id',
    pathMatch: 'full',
  },
  {
    path: 'verse-of-the-day',
    loadComponent: () =>
      import('@upstart-productions/verse-of-the-day').then((m) => m.VerseOfTheDayPage),
  },
  {
    path: 'videos',
    loadComponent: () => import('../videos/videos.page').then((m) => m.VideosPage),
  },
  {
    path: 'tools',
    loadComponent: () => import('../tools/tools.page').then((m) => m.ToolsPage),
  },
  {
    path: 'transformation-tools',
    loadComponent: () =>
      import('../transformation-tools/transformation-tools.page').then(
        (m) => m.TransformationToolsPage
      ),
  },
  {
    path: 'transformation-tools/:id',
    loadComponent: () =>
      import('../transformation-tools/transformation-tool.page').then(
        (m) => m.TransformationToolPage
      ),
  },
  ...REGISTERED_TOOL_ROUTES,
  {
    path: 'saved-items',
    loadComponent: () =>
      import('../saved-items/saved-items.page').then((m) => m.SavedItemsPage),
  },
  {
    path: 'church-partnerships',
    loadComponent: () =>
      import('../church-partnerships/church-partnerships.page').then((m) => m.ChurchPartnershipsPage),
  },
  {
    path: 'partner/:id',
    redirectTo: 'content-detail/partner/:id',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    loadComponent: () => import('../profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'service-unlock/scan',
    loadComponent: () =>
      import('@upstart-productions/service-unlock').then((m) => m.ServiceUnlockScanPage),
  },
  {
    path: 'church-map',
    loadComponent: () => import('../church-map/church-map.page').then((m) => m.ChurchMapPage),
  },
  {
    path: 'connection-center',
    loadComponent: () =>
      import('../connection-center/connection-center.page').then((m) => m.ConnectionCenterPage),
  },
  {
    path: 'jobs-program',
    loadComponent: () => import('../jobs-program/jobs-program.page').then((m) => m.JobsProgramPage),
  },
  {
    path: 'hesed-house',
    loadComponent: () => import('../hesed-house/hesed-house.page').then((m) => m.HesedHousePage),
  },
  {
    path: 'prayer-request',
    loadComponent: () =>
      import('../prayer-request/prayer-request.page').then((m) => m.PrayerRequestPage),
  },
  {
    path: 'gap-ministries',
    loadComponent: () =>
      import('../organization-services/gap-ministries/gap-ministries.page').then(
        (m) => m.GapMinistriesPage
      ),
  },
  {
    path: 'transformation-classes',
    loadComponent: () =>
      import('../organization-services/transformation-classes/transformation-classes.page').then(
        (m) => m.TransformationClassesPage
      ),
  },
  {
    path: 'transformation-classes/:id',
    redirectTo: 'content-detail/class/:id',
    pathMatch: 'full',
  },
  {
    path: 'class-registration/:classId',
    loadComponent: () =>
      import('../class-registration/class-registration.page').then((m) => m.ClassRegistrationPage),
  },
  {
    path: 'content-detail/:type/:id',
    loadComponent: () =>
      import('../organization-services/content-detail/content-detail.page').then(
        (m) => m.ContentDetailPage
      ),
  },
  {
    path: 'donate-goods',
    loadComponent: () => import('../donate-goods/donate-goods.page').then((m) => m.DonateGoodsPage),
  },
  {
    path: 'donate-money',
    loadComponent: () => import('../donate-money/donate-money.page').then((m) => m.DonateMoneyPage),
  },
  {
    path: 'developer-options',
    loadComponent: () =>
      import('../developer-options/developer-options.page').then((m) => m.DeveloperOptionsPage),
  },
  {
    path: 'services',
    loadComponent: () => import('../services/services.page').then((m) => m.ServicesPage),
  },
];

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'about',
        loadComponent: () => import('../about/about.page').then((m) => m.AboutPage),
      },
      {
        path: 'updates',
        loadComponent: () => import('../updates/updates.page').then((m) => m.UpdatesPage),
      },
      {
        path: 'more',
        loadComponent: () => import('../more/more.page').then((m) => m.MorePage),
      },
      ...TAB_DRILL_IN_ROUTES,
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  ...ROOT_DRILL_IN_REDIRECTS,
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
