import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'cookbook/:slug',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cookbook/cookbook.page').then((m) => m.CookbookPage),
  },
  {
    path: 'collection/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cookbook/cookbook.page').then((m) => m.CookbookPage),
  },
  {
    path: 'recipe/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/recipe/recipe.page').then((m) => m.RecipePage),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'home' },
];
