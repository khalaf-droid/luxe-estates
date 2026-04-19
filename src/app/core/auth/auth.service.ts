// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Auth Service (Minimal Stub)
// ─────────────────────────────────────────────────────────────────────────────
// Owner  : Islam (auth module)
// Purpose: Provides the minimum interface consumed by the Properties module.
//          Islam will flesh this out with the full login/register implementation.
//
// Interface consumed by Properties (Task 05):
//   isAuthenticated(): boolean
//   openModal(tab?)  : void
//
// Token keys from coding-rules.md §5.4:
//   localStorage 'luxe_token'  — JWT bearer token
//   localStorage 'luxe_user'   — serialized user object
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// ─── Shape for the open-modal event ──────────────────────────────────────────
export interface AuthModalRequest {
  tab: 'login' | 'register';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // ── Storage keys (coding-rules.md §5.4) ──────────────────────────────────
  private readonly TOKEN_KEY = 'luxe_token';
  private readonly USER_KEY  = 'luxe_user';

  // ── Auth modal trigger ────────────────────────────────────────────────────
  // Components (e.g. nav, auth modal host) subscribe to this to show the modal.
  // Islam: replace Subject with whatever signal your modal uses.
  private readonly _openModal$ = new Subject<AuthModalRequest>();
  readonly openModal$ = this._openModal$.asObservable();

  // ── Logged-in state ───────────────────────────────────────────────────────
  // BehaviorSubject so any component can reactively track auth state.
  private readonly _isAuthenticated$ = new BehaviorSubject<boolean>(
    !!localStorage.getItem(this.TOKEN_KEY)
  );
  readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  // ── isAuthenticated() — synchronous check used by auth guards ────────────
  // Task 05 requirement: if (!this.authService.isAuthenticated()) { ... }
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // ── openModal() — triggers the auth modal ────────────────────────────────
  // Islam: wire this to your modal open logic via the Subject stream above.
  openModal(tab: 'login' | 'register' = 'login'): void {
    this._openModal$.next({ tab });
  }

  // ── getCurrentUser() ─────────────────────────────────────────────────────
  getCurrentUser<T = unknown>(): T | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  // ── getToken() ───────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ── login() / logout() — stubs for Islam to implement ────────────────────
  login(token: string, user: unknown): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._isAuthenticated$.next(true);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isAuthenticated$.next(false);
  }
}
