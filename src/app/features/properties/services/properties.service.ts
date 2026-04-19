// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Properties Service
// ─────────────────────────────────────────────────────────────────────────────
// Responsibilities:
//   • GET  /api/properties          → getProperties(filters?)
//   • GET  /api/properties/:id      → getPropertyById(id)
//   • POST /api/favorites/:id       → toggleFavorite(id)
//   • POST /api/viewings            → scheduleViewing(propertyId, date)
//   • POST /api/inquiries           → makeInquiry(propertyId, message)
//
// On any HTTP error → catchError returns Observable of MOCK_PROPERTIES
// API base URL always from environment.apiUrl (http://localhost:5000/api)
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Property, PropertyFilters } from '../models/property.model';
import { MOCK_PROPERTIES } from './mock-properties';

// ─── API response wrapper (matches backend shape) ───────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PropertiesService {
  private readonly base = environment.apiUrl;

  // Expose mock data so components can reference it without importing
  readonly mockProperties: Property[] = MOCK_PROPERTIES;

  // ── Filter state — BehaviorSubject (Task 03) ──────────────────────────────
  // Holds the active tab key: 'all' | 'for-sale' | 'for-rent' | type
  readonly activeFilter$ = new BehaviorSubject<string>('all');

  // ── Filtered stream — switchMap re-fetches on every filter change ────────────
  // Uses real API when available, falls back to mock on error (via getProperties)
  // switchMap cancels any in-flight request when filter changes quickly
  readonly filteredProperties$: Observable<Property[]> = this.activeFilter$.pipe(
    switchMap((filter) => {
      if (filter === 'all')                              return this.getProperties();
      if (filter === 'for-sale' || filter === 'for-rent') return this.getProperties({ status: filter as 'for-sale' | 'for-rent' });
      return this.getProperties({ type: filter as 'apartment' | 'villa' | 'penthouse' | 'estate' });
    })
  );

  constructor(private http: HttpClient) {}

  // ── Set active filter tab ─────────────────────────────────────────────────
  setFilter(filter: string): void {
    this.activeFilter$.next(filter);
  }

  // ── Tab filter — maps tab key to Property fields ──────────────────────────
  // Keeps all filter logic out of components (per task requirement)
  applyTabFilter(properties: Property[], filter: string): Property[] {
    switch (filter) {
      case 'all':        return properties;
      case 'for-sale':   return properties.filter(p => p.status === 'for-sale');
      case 'for-rent':   return properties.filter(p => p.status === 'for-rent');
      case 'apartment':  return properties.filter(p => p.type === 'apartment');
      case 'villa':      return properties.filter(p => p.type === 'villa');
      case 'penthouse':  return properties.filter(p => p.type === 'penthouse');
      case 'estate':     return properties.filter(p => p.type === 'estate');
      default:           return properties;
    }
  }

  // ── 01 · GET all properties (with optional filters) ──────────────────────
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
        catchError(() => of(this.applyClientFilters(MOCK_PROPERTIES, filters)))
      );
  }

  // ── 02 · GET single property by id ───────────────────────────────────────
  getPropertyById(id: string): Observable<Property> {
    return this.http
      .get<ApiResponse<Property>>(`${this.base}/properties/${id}`)
      .pipe(
        map((res) => res.data),
        catchError(() => {
          const found = MOCK_PROPERTIES.find((p) => p._id === id);
          return of(found ?? MOCK_PROPERTIES[0]);
        })
      );
  }

  // ── 03 · POST toggle favorite ────────────────────────────────────────────
  toggleFavorite(propertyId: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<{ favorited: boolean }>>(
        `${this.base}/favorites/${propertyId}`,
        {}
      )
      .pipe(
        map((res) => res.data.favorited),
        catchError(() => {
          // Offline fallback: persist in localStorage
          const stored = this.getLocalFavorites();
          const isFav  = stored.includes(propertyId);
          if (isFav) {
            this.saveLocalFavorites(stored.filter((id) => id !== propertyId));
          } else {
            this.saveLocalFavorites([...stored, propertyId]);
          }
          return of(!isFav);
        })
      );
  }

  // ── 04 · POST schedule viewing ───────────────────────────────────────────
  // Returns true on API success, false on error — component uses this
  // to decide which notification to show (Task 06)
  scheduleViewing(propertyId: string, date: string): Observable<boolean> {
    return this.http
      .post<void>(`${this.base}/viewings`, { propertyId, date })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  // ── 05 · POST make inquiry ───────────────────────────────────────────────
  // Returns true on API success, false on error — same pattern as above
  makeInquiry(propertyId: string, message: string): Observable<boolean> {
    return this.http
      .post<void>(`${this.base}/inquiries`, { propertyId, message })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  // ── Helpers: localStorage favorites ──────────────────────────────────────
  getLocalFavorites(): string[] {
    try {
      return JSON.parse(localStorage.getItem('luxe_favorites') ?? '[]');
    } catch {
      return [];
    }
  }

  isFavorited(propertyId: string): boolean {
    return this.getLocalFavorites().includes(propertyId);
  }

  private saveLocalFavorites(ids: string[]): void {
    localStorage.setItem('luxe_favorites', JSON.stringify(ids));
  }

  // ── Client-side filter (used when API is offline) ─────────────────────────
  applyClientFilters(
    properties: Property[],
    filters?: PropertyFilters
  ): Property[] {
    if (!filters) return properties;

    return properties.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.type   && p.type   !== filters.type)   return false;
      if (filters.city   && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      if (filters.minPrice && p.price < filters.minPrice) return false;
      return true;
    });
  }

  // ── Price formatter — currency-aware, matches Template formatPrice() ────
  // Signature updated: currency param added so GBP/EUR show £/€ correctly
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

