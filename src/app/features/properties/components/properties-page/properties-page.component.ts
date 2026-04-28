import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class PropertiesPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(PropertiesService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  // ── Reactive State ────────────────────────────────────────────────────────
  properties$: Observable<Property[]> = this.svc.properties$;
  isLoading$: Observable<boolean> = this.svc.loading$;
  activeFilter$: Observable<string> = this.svc.activeFilter$;

  // UI state
  selectedProperty: Property | null = null;
  
  filterTabs = [
    { label: 'All', key: 'all' },
    { label: 'For Sale', key: 'for-sale' },
    { label: 'For Rent', key: 'for-rent' },
    { label: 'Apartments', key: 'apartment' },
    { label: 'Villas', key: 'villa' },
    { label: 'Penthouses', key: 'penthouse' },
  ];

  ngOnInit(): void {
    // Sync filters from URL query parameters
    this.route.queryParams
      .pipe(
        debounceTime(50),
        map((params) => this.mapToFilters(params)),
        distinctUntilChanged((a, b) => this.isEqual(a, b)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((filters) => {
        this.svc.setFilters(filters);
      });
  }

  private mapToFilters(params: Params): PropertyFilters {
    if (Object.keys(params).length === 0) return {};

    return {
      city: params['location'],
      type: params['type'],
      status: params['listingType'],
      minPrice: params['minPrice'] ? Number(params['minPrice']) : undefined,
      maxPrice: params['maxPrice'] ? Number(params['maxPrice']) : undefined,
      page: params['page'] ? Number(params['page']) : 1,
    };
  }

  private isEqual(a: PropertyFilters, b: PropertyFilters): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) => (a as any)[key] === (b as any)[key])
    );
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

  onViewAll(): void {
    this.svc.setFilters({});
  }

  onModalClosed(): void {
    this.selectedProperty = null;
  }

  trackById(_index: number, item: Property): string {
    return item._id;
  }
}
