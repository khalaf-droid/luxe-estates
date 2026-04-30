import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';

export interface AdminStats {
  users: number;
  properties: number;
  bookings: number;
  revenue: number;
}

interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
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
      if (Array.isArray(res.data)) {
        return res.data;
      }

      const data = res.data as Record<string, T[]>;
      const value = data?.[key];
      return Array.isArray(value) ? value : [];
    };
  }

  getStats(): Observable<AdminStats> {
    return this.http
      .get<ApiResponse<{
        totalUsers?: number;
        totalProperties?: number;
        totalBookings?: number;
        totalRevenue?: number;
      }>>(`${this.base}/dashboard/admin/stats`)
      .pipe(
        map((res) => ({
          users: res.data?.totalUsers ?? 0,
          properties: res.data?.totalProperties ?? 0,
          bookings: res.data?.totalBookings ?? 0,
          revenue: res.data?.totalRevenue ?? 0,
        })),
        catchError(this.handleError('Failed to load dashboard stats'))
      );
  }

  getUsers(): Observable<any[]> {
    return this.http.get<ApiResponse<any[] | { users: any[] }>>(`${this.base}/users`).pipe(
      map(this.unwrapList<any>('users')),
      catchError(this.handleError('Failed to load users'))
    );
  }

  getProperties(): Observable<any[]> {
    return this.http.get<ApiResponse<any[] | { properties: any[] }>>(`${this.base}/properties?limit=100`).pipe(
      map(this.unwrapList<any>('properties')),
      catchError(this.handleError('Failed to load properties'))
    );
  }

  getBookings(): Observable<any[]> {
    return this.http.get<ApiResponse<any[] | { bookings: any[] }>>(`${this.base}/dashboard/admin/bookings?limit=100`).pipe(
      map(this.unwrapList<any>('bookings')),
      catchError(this.handleError('Failed to load bookings'))
    );
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/dashboard/admin/users/${userId}/role`, { role }).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to update user role'))
    );
  }

  updatePropertyApproval(propertyId: string, decision: 'approve' | 'reject'): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/dashboard/admin/properties/${propertyId}/${decision}`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to update property approval'))
    );
  }

  updateBookingStatus(bookingId: string, status: string): Observable<any> {
    const action = status === 'approved' ? 'approve' : 'reject';
    return this.http.patch<ApiResponse<any>>(`${this.base}/bookings/${bookingId}/${action}`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to update booking status'))
    );
  }
}
