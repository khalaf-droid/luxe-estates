// ============================================================
// LUXE ESTATES — App Shell Component
// Global ESC listener lives here — single source of truth for
// keyboard modal dismissal across the entire application.
// ============================================================

import { Component, HostListener } from '@angular/core';
import { AuthService } from './core/auth/auth.service';
import { ModalEscapeService } from './core/services/modal-escape.service';

@Component({
  selector: 'app-root',
  template: `
    <app-cursor></app-cursor>
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

  constructor(
    private auth: AuthService,
    private modalEscapeService: ModalEscapeService, // injected — broadcasts ESC to all modals
  ) {}

  /**
   * Single document-level ESC listener for the entire app.
   * Triggers the ModalEscapeService bus so any subscribed modal
   * can close itself without competing @HostListeners.
   *
   * Reference: index.html lines 2388–2394 (keyboard ESC handler)
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.modalEscapeService.trigger();
  }

  // Helper kept for dev/testing convenience — open auth modal programmatically
  testOpenModal(): void {
    this.auth.openModal();
  }
}