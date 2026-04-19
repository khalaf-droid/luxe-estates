/**
 * auth.guard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Protects any route that requires an authenticated user.
 *
 * If NOT authenticated:
 *   1. Redirects to '/'
 *   2. Automatically opens the Auth Modal (no routing required)
 *
 * Usage in app.routes.ts (or feature routes):
 *   {
 *     path: 'dashboard',
 *     canActivate: [authGuard],
 *     loadComponent: () => import(...)
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Not authenticated — redirect home and pop the login modal
  router.navigate(['/']);
  auth.openModal();
  return false;
};