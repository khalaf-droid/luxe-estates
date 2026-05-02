// ============================================================
// LUXE ESTATES — App Shell Component
// Global ESC listener lives here — single source of truth for
// keyboard modal dismissal across the entire application.
// ============================================================

import { Component, HostListener, OnInit, inject } from '@angular/core';
import { AuthService } from './core/auth/auth.service';
import { ModalEscapeService } from './core/services/modal-escape.service';

@Component({
  selector: 'app-root',
  template: `
    <app-cursor></app-cursor>
    
    <!-- Navbar is back for all routes -->
    <app-nav></app-nav>
    
    <router-outlet></router-outlet>
    
    <app-footer></app-footer>
    
    <app-notification></app-notification>
    <app-auth-modal></app-auth-modal>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AppComponent {
  title = 'luxe-estates';

  private auth = inject(AuthService);
  private modalEscapeService = inject(ModalEscapeService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.modalEscapeService.trigger();
  }

  testOpenModal(): void {
    this.auth.openModal();
  }
}