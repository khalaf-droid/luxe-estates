import { Component, HostListener, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ModalEscapeService } from './core/services/modal-escape.service';
import { filter } from 'rxjs/operators';

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

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute = event.urlAfterRedirects.includes('/admin');
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.modalEscapeService.trigger();
  }
}