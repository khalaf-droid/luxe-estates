// ============================================================
// LUXE ESTATES — Scroll Service
// Smoothly scrolls to any section by its HTML element ID.
// Mirrors template helper (index.html line 2374):
//   function scrollToSection(id) {
//     const el = document.getElementById(id);
//     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
//   }
//
// Usage examples (inject where needed — do NOT call directly):
//   // Hero "Explore Properties" button → this.scroll.scrollTo('properties')
//   // Footer "For Sale" link          → this.scroll.scrollTo('properties')
//   // Nav anchor links                → this.scroll.scrollTo(fragment)
// ============================================================

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollService {

  /**
   * Smoothly scrolls the viewport to the element matching the given ID.
   * No-ops silently if the element is not found in the current DOM —
   * safe to call from any route or lifecycle hook.
   *
   * @param sectionId — the `id` attribute of the target HTML element
   */
  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
