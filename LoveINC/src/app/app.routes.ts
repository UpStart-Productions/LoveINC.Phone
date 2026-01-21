import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingService } from './services/onboarding.service';

// Guard function to check if onboarding is completed
const onboardingGuard = () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);
  
  if (!onboardingService.hasCompletedOnboarding()) {
    router.navigate(['/onboarding/step1']);
    return false;
  }
  return true;
};

// Guard function to redirect to tabs if onboarding already completed
const skipOnboardingGuard = () => {
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
    path: 'onboarding/step1',
    loadComponent: () => import('./onboarding/onboarding-step1.page').then(m => m.OnboardingStep1Page),
    canActivate: [skipOnboardingGuard]
  },
  {
    path: 'onboarding/step2',
    loadComponent: () => import('./onboarding/onboarding-step2.page').then(m => m.OnboardingStep2Page),
    canActivate: [skipOnboardingGuard]
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [onboardingGuard]
  },
];
