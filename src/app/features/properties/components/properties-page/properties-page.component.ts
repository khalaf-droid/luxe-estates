import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, tap } from 'rxjs/operators';

import { PropertiesService } from '../../services/properties.service';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Property, PropertyFilters } from '../../models/property.model';

@Component({
  selector: 'app-properties-page',
  templateUrl: './properties-page.component.html',
  styleUrls: ['./properties-page.component.scss'],
})
export class PropertiesPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private svc = inject(PropertiesService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // ── Reactive State ────────────────────────────────────────────────────────
  properties$: Observable<Property[]> = this.svc.filteredProperties$;
  activeFilter$: Observable<string> = this.svc.activeFilter$;

  // UI state
  selectedProperty: Property | null = null;
  isLoading = true;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // 1. Sync filters from URL query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (Object.keys(params).length > 0) {
          const filters: PropertyFilters = {
            city: params['location'],
            type: params['type'],
            status: params['listingType'],
            minPrice: params['minPrice'] ? Number(params['minPrice']) : undefined,
            maxPrice: params['maxPrice'] ? Number(params['maxPrice']) : undefined,
          };
          this.fetchProperties(filters);
        } else {
          this.svc.setFilter('all');
        }
      });

    // 2. Track loading state
    this.properties$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.isLoading = false));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchProperties(filters: PropertyFilters): void {
    this.isLoading = true;
    this.svc.getProperties(filters).subscribe({
      next: (data) => {
        // Here we could update the BehaviorSubject in the service if needed,
        // or just let the local component handle it.
        // For now, we'll use a local observable if it's a one-off search,
        // but the architectural goal is to use the service's stream.
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to fetch properties', 'error');
      }
    });
  }

  onFilterChange(filter: string): void {
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

  closeModal(): void {
    this.selectedProperty = null;
  }

  trackById(_index: number, item: Property): string {
    return item._id;
  }
}
