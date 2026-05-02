import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PropertiesService } from '../../services/properties.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Property, PropertyFilters, PropertyType } from '../../models/property.model';

@Component({
  selector: 'app-properties-page',
  templateUrl: './properties-page.component.html',
  styleUrls: ['./properties-page.component.scss'],
})
export class PropertiesPageComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private svc     = inject(PropertiesService);
  private favoritesService    = inject(FavoritesService);
  private authService         = inject(AuthService);
  private notificationService = inject(NotificationService);
  private destroyRef          = inject(DestroyRef);

  // ── Reactive State ────────────────────────────────────────────────────────
  properties$:   Observable<Property[]> = this.svc.properties$;
  isLoading$:    Observable<boolean>    = this.svc.loading$;
  activeFilter$: Observable<string>     = this.svc.activeFilter$;
  error$:        Observable<string | null> = this.svc.error$;

  // Pagination state
  currentPage  = 1;
  totalPages   = 1;
  totalResults = 0;

  // UI state
  selectedProperty: Property | null = null;

  // ── Filter tabs — aligned with backend enum exactly ───────────────────────
  filterTabs = [
    { label: 'All',         key: 'all' },
    { label: 'For Sale',    key: 'for-sale' },
    { label: 'For Rent',    key: 'for-rent' },
    { label: 'Apartments',  key: 'apartment' },
    { label: 'Villas',      key: 'villa' },
    { label: 'Houses',      key: 'house' },
    { label: 'Studios',     key: 'studio' },
    { label: 'Commercial',  key: 'commercial' },
  ];

  ngOnInit(): void {
    // Sync filters from URL query parameters
    this.route.queryParams
      .pipe(
        debounceTime(200),
        map((params) => this.mapToFilters(params)),
        distinctUntilChanged((a, b) => this.isEqual(a, b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((filters) => {
        this.currentPage = filters.page ?? 1;
        this.svc.setFilters(filters);
      });

    // Subscribe to pagination metadata
    this.svc.pagination$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(meta => {
        if (meta) {
          // Delay to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.totalPages   = meta.pages;
            this.totalResults = meta.total;
            this.currentPage  = meta.page;
          });
        }
      });
  }

  private mapToFilters(params: Params): PropertyFilters {
    if (Object.keys(params).length === 0) return {};

    return {
      search:   params['search']   || undefined,
      city:     params['location'] || params['city'] || undefined,
      type:     params['type']     as PropertyType | undefined,
      status:   params['listingType'] === 'rent' ? 'for-rent' :
                params['listingType'] === 'sale' ? 'for-sale' : undefined,
      minPrice: params['minPrice'] ? Number(params['minPrice']) : undefined,
      maxPrice: params['maxPrice'] ? Number(params['maxPrice']) : undefined,
      page:     params['page']     ? Number(params['page'])     : 1,
      cursor:   params['cursor']   || undefined,
    };
  }

  private isEqual(a: PropertyFilters, b: PropertyFilters): boolean {
    const keysA = Object.keys(a).filter(k => (a as any)[k] !== undefined);
    const keysB = Object.keys(b).filter(k => (b as any)[k] !== undefined);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) => (a as any)[key] === (b as any)[key])
    );
  }

  onFilterChange(filter: string): void {
    this.currentPage = 1;
    this.svc.setFilter(filter);
  }

  onFavoriteToggled(propertyId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to save favorites', 'info');
      return;
    }

    this.favoritesService.toggleFavorite(propertyId).subscribe({
      next: (isFav) => {
        this.notificationService.show(
          isFav ? 'Added to favorites' : 'Removed from favorites',
          isFav ? 'success' : 'info'
        );
      },
      error: () => {
        this.notificationService.show('Failed to update favorite', 'error');
      }
    });
  }

  onViewDetails(property: Property): void {
    this.selectedProperty = property;
  }

  onViewAll(): void {
    this.currentPage = 1;
    this.svc.setFilters({});
  }

  onModalClosed(): void {
    this.selectedProperty = null;
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const currentFilters = this.svc.getCurrentFilters();
    this.svc.setFilters({ ...currentFilters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retryLoad(): void {
    this.svc.setFilters(this.svc.getCurrentFilters());
  }

  trackById(_index: number, item: Property): string {
    return item._id;
  }
}
