import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from './services/onboarding.service';

const welcomeGuard = () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  if (!onboardingService.hasCompletedOnboarding()) {
    router.navigate(['/onboarding/welcome']);
    return false;
  }
  return true;
};

const skipWelcomeGuard = () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  if (onboardingService.hasCompletedOnboarding()) {
    router.navigate(['/tabs']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  {
    path: 'onboarding/welcome',
    loadComponent: () => import('./onboarding/onboarding-step1.page').then(m => m.OnboardingStep1Page),
    canActivate: [skipWelcomeGuard]
  },
  {
    path: 'onboarding/step1',
    redirectTo: 'onboarding/welcome',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [welcomeGuard]
  },
];
