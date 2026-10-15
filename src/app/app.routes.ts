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
  {
    path: 'add',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/add/add.page').then((m) => m.AddPage),
  },
  {
    path: 'recipe/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/edit/edit.page').then((m) => m.EditPage),
  },
  {
    path: 'screen',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/screen/screen.page').then((m) => m.ScreenPage),
  },
  {
    path: 'friends',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/friends/friends.page').then((m) => m.FriendsPage),
  },
  {
    path: 'inbox',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inbox/inbox.page').then((m) => m.InboxPage),
  },
  {
    path: 'invite/:token',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/invite/invite.page').then((m) => m.InvitePage),
  },
  { path: '**', redirectTo: 'home' },
];
