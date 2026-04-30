import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * adminGuard
 * ─────────────────────────────────────────────────────────────────────────────
 * Restricts access to routes that require an 'admin' role.
 * 
 * If NOT an admin:
 *   1. Redirects to '/'
 *   2. Potentially shows a notification (optional)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const adminGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const currentUser = auth.currentUser$.getValue();

  if (currentUser && currentUser.role === 'admin') {
    return true;
  }

  // Not an admin — redirect to home
  router.navigate(['/']);
  return false;
};
