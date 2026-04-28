import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, shareReplay, finalize } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Property, PropertyFilters } from '../models/property.model';
import { NotificationService } from '../../../shared/services/notification.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private readonly base = environment.apiUrl;

  // ── Reactive State ────────────────────────────────────────────────────────
  private _filters$ = new BehaviorSubject<PropertyFilters>({});
  readonly filters$ = this._filters$.asObservable();

  private _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  readonly properties$: Observable<Property[]> = this.filters$.pipe(
    switchMap((filters) => {
      this._loading$.next(true);
      return this.getProperties(filters).pipe(
        finalize(() => this._loading$.next(false))
      );
    }),
    shareReplay(1)
  );

  // Maintain backward compatibility for existing components
  readonly activeFilter$ = new BehaviorSubject<string>('all');
  readonly filteredProperties$ = this.properties$;

  setFilters(filters: PropertyFilters): void {
    this._filters$.next(filters);
  }

  setFilter(filter: string): void {
    this.activeFilter$.next(filter);
    
    if (filter === 'all') {
      this.setFilters({});
      return;
    }

    const statusMap: Record<string, 'for-sale' | 'for-rent'> = {
      'for-sale': 'for-sale',
      'for-rent': 'for-rent',
    };
    const typeMap: Record<string, 'apartment' | 'villa' | 'penthouse' | 'estate'> = {
      apartment: 'apartment',
      villa: 'villa',
      penthouse: 'penthouse',
      estate: 'estate',
    };

    if (statusMap[filter]) {
      this.setFilters({ status: statusMap[filter] });
    } else if (typeMap[filter]) {
      this.setFilters({ type: typeMap[filter] });
    }
  }

  getProperties(filters?: PropertyFilters): Observable<Property[]> {
    let params = new HttpParams();
    if (filters?.status)   params = params.set('status',   filters.status);
    if (filters?.type)     params = params.set('type',     filters.type);
    if (filters?.city)     params = params.set('city',     filters.city);
    if (filters?.maxPrice) params = params.set('maxPrice', String(filters.maxPrice));
    if (filters?.minPrice) params = params.set('minPrice', String(filters.minPrice));
    if (filters?.page)     params = params.set('page',     String(filters.page));

    return this.http
      .get<ApiResponse<Property[]>>(`${this.base}/properties`, { params })
      .pipe(
        map((res) => res.data),
        catchError((err: any) => {
          this.notificationService.show('Failed to load properties', 'error');
          return throwError(() => err);
        })
      );
  }

  getPropertyById(id: string): Observable<Property> {
    return this.http
      .get<ApiResponse<Property>>(`${this.base}/properties/${id}`)
      .pipe(
        map((res) => res.data),
        catchError(err => throwError(() => err))
      );
  }

  getMyProperties(): Observable<Property[]> {
    return this.http
      .get<ApiResponse<Property[]>>(`${this.base}/properties?owner=me`)
      .pipe(
        map(res => res.data),
        catchError(err => throwError(() => err))
      );
  }

  formatPrice(
    price: number,
    currency: string,
    status: 'for-sale' | 'for-rent'
  ): string {
    const symbols: Record<string, string> = {
      USD: '$',
      GBP: '£',
      EUR: '€',
      AED: 'AED ',
    };
    const symbol = symbols[currency] ?? '$';

    const formatted =
      price >= 1_000_000
        ? `${symbol}${(price / 1_000_000).toFixed(1)}M`
        : price >= 1_000
        ? `${symbol}${(price / 1_000).toFixed(0)}K`
        : `${symbol}${price.toLocaleString()}`;

    return status === 'for-rent' ? `${formatted} / mo` : formatted;
  }
}
