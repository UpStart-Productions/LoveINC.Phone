import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('../about/about.page').then((m) => m.AboutPage),
      },
      {
        path: 'updates',
        loadComponent: () =>
          import('../updates/updates.page').then((m) => m.UpdatesPage),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('../contact/contact.page').then((m) => m.ContactPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'church-map',
        loadComponent: () =>
          import('../church-map/church-map.page').then((m) => m.ChurchMapPage),
      },
      {
        path: 'gap-ministries',
        loadComponent: () =>
          import('../organization-services/gap-ministries/gap-ministries.page').then((m) => m.GapMinistriesPage),
      },
      {
        path: 'transformation-classes',
        loadComponent: () =>
          import('../organization-services/transformation-classes/transformation-classes.page').then((m) => m.TransformationClassesPage),
      },
      {
        path: 'transformation-classes/:id',
        loadComponent: () =>
          import('../organization-services/transformation-classes/transformation-class-detail.page').then((m) => m.TransformationClassDetailPage),
      },
      {
        path: 'donate-goods',
        loadComponent: () =>
          import('../donate-goods/donate-goods.page').then((m) => m.DonateGoodsPage),
      },
      {
        path: 'donate-money',
        loadComponent: () =>
          import('../donate-money/donate-money.page').then((m) => m.DonateMoneyPage),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
