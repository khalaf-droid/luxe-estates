// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Properties Page Component
// Visual reference: Template/index.html — section.properties-section (lines 1526–1553)
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Property } from '../../models/property.model';
import { PropertiesService } from '../../services/properties.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';

// ─── Filter tab definition ───────────────────────────────────────────────────
interface FilterTab {
  key: string;
  label: string;
}

@Component({
  selector: 'app-properties-page',
  templateUrl: './properties-page.component.html',
  styleUrls: ['./properties-page.component.scss'],
})
export class PropertiesPageComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Filter tabs — matches Template/index.html lines 1538–1543 ────────────
  readonly filterTabs: FilterTab[] = [
    { key: 'all',        label: 'All'        },
    { key: 'for-sale',   label: 'For Sale'   },
    { key: 'for-rent',   label: 'For Rent'   },
    { key: 'apartment',  label: 'Apartments' },
    { key: 'villa',      label: 'Villas'     },
    { key: 'penthouse',  label: 'Penthouses' },
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  properties: Property[]   = [];
  activeFilter             = 'all';
  isLoading                = true;
  selectedProperty: Property | null = null;   // drives modal *ngIf

  @ViewChild('sectionRef') sectionRef!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  constructor(
    public svc: PropertiesService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Subscribe to filtered stream — all filter logic lives in the service
    this.svc.filteredProperties$
      .pipe(takeUntil(this.destroy$))
      .subscribe((props) => {
        this.properties = props;
        this.isLoading  = false;
      });

    // Keep activeFilter in sync with service BehaviorSubject
    this.svc.activeFilter$
      .pipe(takeUntil(this.destroy$))
      .subscribe((f) => (this.activeFilter = f));
  }

  ngAfterViewInit(): void {
    // Scroll-reveal — matches Template initAnimations() (lines 1946–1956)
    // Adds .visible to .reveal elements as they enter the viewport
    this.initScrollReveal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filter tab click ──────────────────────────────────────────────────────
  onFilterClick(key: string): void {
    this.svc.setFilter(key);   // BehaviorSubject.next() in service
  }

  // ── Card: open modal ────────────────────────────────────────────────────
  onViewDetails(property: Property): void {
    this.selectedProperty = property;
  }

  // ── Modal: close ─────────────────────────────────────────────────────────
  onModalClosed(): void {
    this.selectedProperty = null;
  }

  // ── Modal: schedule viewing — Task 06 handles this inside PropertyModalComponent ──
  // Modal injects PropertiesService directly and calls scheduleViewing() itself.
  // This output is kept for potential future use (e.g. parent-level side-effects).
  onModalScheduleViewing(_property: Property): void { /* handled in modal */ }

  // ── Modal: make inquiry — Task 06 handles this inside PropertyModalComponent ───
  onModalMakeInquiry(_property: Property): void { /* handled in modal */ }

  onScheduleViewing(property: Property): void {
    // Full implementation in Task 06 — placeholder notification for now
    this.notificationService.show(
      `Schedule viewing for ${property.title} — coming in Task 06`,
      'info'
    );
  }

  // ── Task 05: Favorites Toggle with Auth Guard ──────────────────────────────
  // Exact auth-check pattern from task requirement
  onFavoriteToggled(propertyId: string): void {
    // Guard — if not logged in: open auth modal + notify + bail out
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to save favorites', 'info');
      return;
    }

    // Logged in — POST /api/favorites/:id (falls back to localStorage on error)
    this.svc.toggleFavorite(propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isFav) => {
        this.notificationService.show(
          isFav ? 'Added to favorites ✓' : 'Removed from favorites',
          isFav ? 'success' : 'info'
        );
      });
  }

  onViewAll(): void {
    this.notificationService.show('Loading more properties…', 'info');
  }

  // ── trackBy for *ngFor performance ───────────────────────────────────────
  trackById(_: number, p: Property): string {
    return p._id;
  }

  // ── Scroll-reveal: IntersectionObserver ──────────────────────────────────
  // Matches Template/index.html initAnimations() function (lines 1946–1956)
  // threshold: 0.1, rootMargin: '0px 0px -50px 0px'
  private initScrollReveal(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all .reveal elements within this component's section
    const section = this.sectionRef?.nativeElement;
    if (section) {
      section.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }
  }
}
