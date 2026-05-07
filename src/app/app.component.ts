import { Component, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ModalEscapeService } from './core/services/modal-escape.service';
import { ThemeService } from './core/services/theme.service';
import { filter } from 'rxjs/operators';

/**
 * Routes that must always display in dark mode regardless of user theme preference.
 * These are authenticated dashboard/account routes with intentionally dark professional UI.
 */
const DARK_LOCKED_ROUTES = ['/account', '/dashboard'];

@Component({
  selector: 'app-root',
  template: `
    <div [class.admin-mode]="isAdminRoute">
      <app-cursor></app-cursor>
      
      <app-nav></app-nav>
      
      <router-outlet></router-outlet>
      
      <app-footer></app-footer>
      
      <app-notification></app-notification>
      <app-auth-modal></app-auth-modal>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .admin-mode app-footer {
      display: block;
      margin-left: 280px; /* Width of admin sidebar */
    }
  `]
})
export class AppComponent {
  title = 'luxe-estates';
  isAdminRoute = false;

  private auth = inject(AuthService);
  private modalEscapeService = inject(ModalEscapeService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url: string = event.urlAfterRedirects;

      // Admin sidebar layout toggle
      this.isAdminRoute = url.includes('/admin');

      // ── Route-Locked Dark Mode ──────────────────────────────────
      // /account and /dashboard retain dark professional UI regardless
      // of the global theme preference. We override data-theme on <html>
      // without modifying the user's stored preference so it restores
      // correctly when they navigate back to public pages.
      const isDarkLocked = DARK_LOCKED_ROUTES.some(route => url.startsWith(route));

      if (isDarkLocked) {
        this.themeService.lockRoute('dark');
      } else {
        this.themeService.unlockRoute();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.modalEscapeService.trigger();
  }
}