import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'luxe-theme';
  private themeSubject = new BehaviorSubject<Theme>('dark');
  theme$ = this.themeSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.watchSystemPreference();
      this.watchStorageChanges();
    }
  }

  setTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem(this.THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.themeSubject.next(theme);
  }

  toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    this.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  getTheme(): Theme {
    return this.themeSubject.value;
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initialTheme = savedTheme || systemTheme;
    
    this.setTheme(initialTheme);
  }

  private watchSystemPreference(): void {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
      if (!localStorage.getItem(this.THEME_KEY)) {
        this.setTheme(e.matches ? 'light' : 'dark');
      }
    });
  }

  private watchStorageChanges(): void {
    fromEvent<StorageEvent>(window, 'storage').subscribe(event => {
      if (event.key === this.THEME_KEY && event.newValue) {
        this.setTheme(event.newValue as Theme);
      }
    });
  }
}
