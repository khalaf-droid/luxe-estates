import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'host' | 'admin';
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface UserStats {
  totalBookings: number;
  activeBookings: number;
  savedProperties: number;
  totalSpent: number;
  listedProperties?: number;
}

interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private readonly base = environment.apiUrl;

  private handleError(message: string) {
    return (err: any) => {
      this.notificationService.show(message, 'error');
      return throwError(() => err);
    };
  }

  private unwrapList<T>(key: string) {
    return (res: ApiResponse<T[] | Record<string, T[]>>) => {
      if (Array.isArray(res.data)) return res.data;
      const data = res.data as Record<string, T[]>;
      const value = data?.[key];
      return Array.isArray(value) ? value : [];
    };
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.base}/users/me`).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to load profile'))
    );
  }

  updateProfile(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<ApiResponse<UserProfile>>(`${this.base}/users/me`, payload).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to update profile'))
    );
  }

  getStats(): Observable<UserStats> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard/buyer/stats`).pipe(
      map((res) => ({
        totalBookings: res.data?.totalBookings ?? 0,
        activeBookings: res.data?.activeBookings ?? 0,
        savedProperties: res.data?.savedProperties ?? 0,
        totalSpent: res.data?.totalSpent ?? 0,
        listedProperties: res.data?.listedProperties ?? 0,
      }))
    );
  }

  getMyBookings(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/bookings`).pipe(
      map(this.unwrapList<any>('bookings')),
      catchError(this.handleError('Failed to load bookings'))
    );
  }

  cancelBooking(bookingId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/bookings/${bookingId}/cancel`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to cancel booking'))
    );
  }

  getSavedProperties(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/favorites`).pipe(
      map(this.unwrapList<any>('favorites')),
      catchError(this.handleError('Failed to load saved properties'))
    );
  }

  unsaveProperty(propertyId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.base}/favorites/${propertyId}`).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to remove saved property'))
    );
  }

  getMyProperties(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/properties/my`).pipe(
      map(this.unwrapList<any>('properties')),
      catchError(this.handleError('Failed to load your properties'))
    );
  }

  getPayments(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/payments`).pipe(
      map(this.unwrapList<any>('payments')),
      catchError(this.handleError('Failed to load payments'))
    );
  }

  initiatePayment(bookingId: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/payments/checkout`, {
      bookingId,
      paymentMethod: 'paymob' // Default for now
    }).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to initiate payment'))
    );
  }
}
