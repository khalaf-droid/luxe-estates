import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Property, PropertyFilters } from '../models/property.model';

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
  private readonly base = environment.apiUrl;

  readonly activeFilter$ = new BehaviorSubject<string>('all');

  readonly filteredProperties$: Observable<Property[]> = this.activeFilter$.pipe(
    switchMap((filter) => {
      if (filter === 'all') return this.getProperties();
      if (filter === 'for-sale' || filter === 'for-rent') {
        return this.getProperties({ status: filter as 'for-sale' | 'for-rent' });
      }
      return this.getProperties({ type: filter as 'apartment' | 'villa' | 'penthouse' | 'estate' });
    })
  );

  setFilter(filter: string): void {
    this.activeFilter$.next(filter);
  }

  getProperties(filters?: PropertyFilters): Observable<Property[]> {
    let params = new HttpParams();
    if (filters?.status)   params = params.set('status',   filters.status);
    if (filters?.type)     params = params.set('type',     filters.type);
    if (filters?.city)     params = params.set('city',     filters.city);
    if (filters?.maxPrice) params = params.set('maxPrice', String(filters.maxPrice));
    if (filters?.minPrice) params = params.set('minPrice', String(filters.minPrice));

    return this.http
      .get<ApiResponse<Property[]>>(`${this.base}/properties`, { params })
      .pipe(
        map((res) => res.data),
        catchError(err => throwError(() => err))
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
