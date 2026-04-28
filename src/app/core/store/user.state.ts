/**
 * user.state.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * A thin, importable wrapper around AuthService's BehaviorSubject.
 * Any team member can inject UserState to read/watch the current user
 * without coupling directly to all of AuthService.
 *
 * Usage (any component):
 *   private userState = inject(UserState);
 *   user$ = this.userState.currentUser$;
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService, User, UserRole } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class UserState {

  private auth = inject(AuthService);

  /** Observable stream — subscribe for reactive updates */
  readonly currentUser$: Observable<User | null> = this.auth.currentUser$.asObservable();

  /** Sync snapshot — use when you just need the current value once */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /** True when a user is logged in (real or demo) */
  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  /** True when the app is running in Demo Mode (no backend) */
  get isDemoMode(): boolean {
    return this.auth.isDemoMode();
  }

  /** Get the current user's role */
  get userRole(): UserRole | null {
    return this.currentUser?.role ?? null;
  }
}