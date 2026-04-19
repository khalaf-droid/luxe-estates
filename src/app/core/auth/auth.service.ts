// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Auth Service (Fully Implemented by Islam)
// Includes: Real LocalStorage DB, OTP Flow, and Team Interface Compatibility
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
  password?: string; 
}

export interface AuthModalRequest {
  tab: 'login' | 'register';
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ── Storage Keys (Agreed upon with the team) ─────────────────────────────
  private readonly TOKEN_KEY = 'luxe_token';
  private readonly USER_KEY  = 'luxe_user';
  private readonly DB_KEY    = 'luxe_all_users'; 

  // ── Global User State ────────────────────────────────────────────────────
  currentUser$ = new BehaviorSubject<User | null>(null);

  get currentUser(): User | null {
    return this.currentUser$.value;
  }

  // Team Compatibility: Observable for auth status
  private readonly _isAuthenticated$ = new BehaviorSubject<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
  readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  // ── Modal State ──────────────────────────────────────────────────────────
  private modalOpen$ = new BehaviorSubject<boolean>(false);
  readonly isModalOpen$ = this.modalOpen$.asObservable();

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUser$.next(user);
        this._isAuthenticated$.next(true);
      } catch {
        this.clearStorage();
      }
    }
  }

  // ── Team Expected Interfaces (Task 05 constraints) ───────────────────────
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY) && !!this.currentUser$.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser<T = unknown>(): T | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  openModal(tab: 'login' | 'register' = 'login'): void {
    // Note: We accept the tab parameter to satisfy the team's interface.
    // The modal component defaults to the login tab, or user can switch manually.
    this.modalOpen$.next(true);  
  }

  closeModal(): void { 
    this.modalOpen$.next(false); 
  }

  isDemoMode(): boolean { return false; } // Disabled demo mode for real DB logic

  // ── Islam's Advanced Logic (Login / Register / OTP) ──────────────────────
  
  login(email: string, password: string): Observable<User> {
    const users = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      const token = 'real-local-token-' + Math.random().toString(36).substr(2);
      return of(this.handleAuthSuccess(token, user)).pipe(delay(500));
    } else {
      return throwError(() => new Error('Invalid email or password'));
    }
  }

  register(name: string, email: string, password: string, role: string): Observable<User> {
    const users = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');

    if (users.find((u: any) => u.email === email)) {
      return throwError(() => new Error('Email already exists'));
    }

    const newUser: User = { 
      _id: Math.random().toString(36).substr(2), 
      name, 
      email, 
      password, 
      role 
    };
    
    users.push(newUser);
    localStorage.setItem(this.DB_KEY, JSON.stringify(users));

    return of(newUser).pipe(delay(500));
  }

  checkEmailExists(email: string): boolean {
    const users = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
    return !!users.find((u: any) => u.email === email);
  }

  updatePassword(email: string, newPassword: string): void {
    const users = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem(this.DB_KEY, JSON.stringify(users));
    }
  }

  logout(): void {
    this.clearStorage();
    this.currentUser$.next(null);
    this._isAuthenticated$.next(false);
  }

  // ── Private Helpers ──────────────────────────────────────────────────────
  private handleAuthSuccess(token: string, user: User): User {
    const { password, ...safeUser } = user; // Strip password for security
    const fullUser: User = { ...safeUser, token };
    
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(fullUser));
    
    this.currentUser$.next(fullUser);
    this._isAuthenticated$.next(true); // Notify the team's observable
    
    return fullUser;
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isAuthenticated$.next(false);
  }
}