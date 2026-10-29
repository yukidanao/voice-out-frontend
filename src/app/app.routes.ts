import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/landing/landing.component').then((module) => module.LandingComponent),
  },
  {
    path: 'voices',
    loadComponent: () =>
      import('./components/voices/voices.component').then((module) => module.VoicesComponent),
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./components/feedback/feedback.component').then((module) => module.FeedbackComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./components/about/about.component').then((module) => module.AboutComponent),
  },
  { path: '**', redirectTo: 'home' },
];
