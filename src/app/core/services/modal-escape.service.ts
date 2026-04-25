// ============================================================
// LUXE ESTATES — Modal Escape Service
// Broadcasts a global ESC keypress event so any open modal
// can close itself by subscribing to escape$.
//
// Architecture note:
//   AppComponent owns the single @HostListener('document:keydown.escape')
//   and calls trigger() here. This avoids multiple competing
//   document-level listeners when several modal components exist.
//
// Consumer pattern (any modal component):
//   private destroy$ = new Subject<void>();
//
//   ngOnInit(): void {
//     this.modalEscapeService.escape$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.close());
//   }
//
//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
//
// body.style.overflow pattern (reference: index.html lines 2117, 2121):
//   When modal opens  → document.body.style.overflow = 'hidden'
//   When modal closes → document.body.style.overflow = ''
//   Already applied in AuthModalComponent.close() via AuthService.closeModal()
//   and in PropertyModalComponent. All future modals must follow the same pattern.
//
// Note: PropertyModalComponent handles ESC via its own @HostListener directly
// (separate pattern, already implemented). This service is the shared bus for
// modals that do NOT have their own @HostListener — e.g. AuthModalComponent.
// ============================================================

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalEscapeService {

  // Private Subject — callers never push to this directly
  private readonly _escape$ = new Subject<void>();

  /**
   * Observable that emits once every time the ESC key is pressed
   * (as broadcast by AppComponent). Modal components subscribe here.
   */
  readonly escape$: Observable<void> = this._escape$.asObservable();

  /**
   * Called exclusively by AppComponent's @HostListener.
   * Emits to all active escape$ subscribers simultaneously.
   */
  trigger(): void {
    this._escape$.next();
  }
}
