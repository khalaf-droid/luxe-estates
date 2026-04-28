import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  private readonly favoritesSubject = new BehaviorSubject<string[]>(this.getLocalFavorites());
  readonly favorites$ = this.favoritesSubject.asObservable();

  getFavorites(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/favorites`).pipe(
      map(res => res.data)
    );
  }

  toggleFavorite(propertyId: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<{ favorited: boolean }>>(
        `${this.base}/favorites`,
        { propertyId }
      )
      .pipe(
        map((res) => res.data.favorited),
        tap((isFav) => {
          const current = this.favoritesSubject.value;
          const updated = isFav 
            ? [...current, propertyId] 
            : current.filter(id => id !== propertyId);
          
          this.favoritesSubject.next(updated);
          this.saveLocalFavorites(updated);
        }),
        catchError(() => {
          // Fallback to local state if offline/error
          const current = this.favoritesSubject.value;
          const isFav = current.includes(propertyId);
          const updated = isFav 
            ? current.filter(id => id !== propertyId) 
            : [...current, propertyId];
          
          this.favoritesSubject.next(updated);
          this.saveLocalFavorites(updated);
          return of(!isFav);
        })
      );
  }

  isFavorited$(propertyId: string): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.includes(propertyId))
    );
  }

  private getLocalFavorites(): string[] {
    try {
      return JSON.parse(localStorage.getItem('luxe_favorites') ?? '[]');
    } catch {
      return [];
    }
  }

  private saveLocalFavorites(ids: string[]): void {
    localStorage.setItem('luxe_favorites', JSON.stringify(ids));
  }
}
