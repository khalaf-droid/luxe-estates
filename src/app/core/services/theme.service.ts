import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, map } from 'rxjs';

export type ThemeMode = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'luxe_theme'; // matches anti-flicker script in index.html

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly _theme$ = new BehaviorSubject<ThemeMode>(this._getInitialTheme());

  /** Observable of current theme ('dark' | 'light') — reflects USER preference */
  readonly theme$ = this._theme$.asObservable();

  /** Convenience observable — emits true when dark mode is active */
  readonly isDark$ = this._theme$.pipe(map((t) => t === 'dark'));

  /**
   * Route lock: some routes (e.g. /dashboard, /account) must always appear
   * dark regardless of the user's theme preference.
   * When set, _applyTheme uses the locked theme on <html> without changing
   * the BehaviorSubject (user preference is preserved for when they leave).
   */
  private _routeLock: ThemeMode | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (!isPlatformBrowser(this.platformId)) return;

    // Apply theme immediately on service init
    this._applyTheme(this._theme$.value);

    // Follow OS preference changes — only if user has no stored preference
    window.matchMedia?.('(prefers-color-scheme: dark)')
      .addEventListener('change', (event: MediaQueryListEvent) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          this.setTheme(event.matches ? 'dark' : 'light');
        }
      });

    // Cross-tab sync — if user changes theme in another tab, sync here
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        const theme = event.newValue === 'light' ? 'light' : 'dark';
        if (theme !== this._theme$.value) {
          this._theme$.next(theme);
          // Only apply if no route lock is active
          if (!this._routeLock) {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      }
    });
  }

  /** Get current user-preference theme synchronously */
  getTheme(): ThemeMode {
    return this._theme$.value;
  }

  /** Set a specific theme and persist to localStorage */
  setTheme(theme: ThemeMode): void {
    this._theme$.next(theme);
    this._applyTheme(theme);
  }

  /** Toggle between dark and light */
  toggleTheme(): void {
    this.setTheme(this._theme$.value === 'dark' ? 'light' : 'dark');
  }

  /**
   * Lock the visual theme for a specific route (e.g. /dashboard → dark).
   * Does NOT change the user's stored preference.
   * The <html data-theme> attribute is overridden immediately.
   */
  lockRoute(theme: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this._routeLock = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Remove route lock and restore the user's actual preferred theme.
   * Call this when navigating away from locked routes.
   */
  unlockRoute(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this._routeLock = null;
    // Restore user preference
    document.documentElement.setAttribute('data-theme', this._theme$.value);
  }

  private _applyTheme(theme: ThemeMode): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Respect route lock: if a lock is active, don't override the HTML attribute
    if (!this._routeLock) {
      document.documentElement.setAttribute('data-theme', theme);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Private browsing / storage blocked — silently fail
    }
  }

  private _getInitialTheme(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'dark';

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // Storage blocked
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
