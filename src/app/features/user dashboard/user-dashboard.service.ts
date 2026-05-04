import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

// ── Interfaces matched 1:1 with backend user.model.js ─────────────────────────

export type UserRole = 'buyer' | 'owner' | 'agent' | 'admin';
export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  photo: string;
  bio: string;
  phone: string | null;
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  createdAt: string;
}

// Dashboard data shapes — matched to getMe() controller response
export interface OwnerAgentDashboard {
  role: 'owner' | 'agent';
  properties: any[];
  totalProperties: number;
  activeListings: number;
  bookingRequests: number;
  upcomingViewings: number;
  isVerified: boolean;
  kycStatus: KycStatus;
  kycApproved: boolean;
  kycRejected: boolean;
  kycPending: boolean;
  kycRejectionReason: string | null;
}

export interface BuyerDashboard {
  role: 'buyer';
  savedPropertiesCount: number;
  myBookings: any[];
  viewingRequests: any[];
  isVerified: boolean;
  kycStatus: KycStatus;
  kycApproved: boolean;
  kycRejected: boolean;
  kycPending: boolean;
  kycRejectionReason: string | null;
}

export type DashboardData = OwnerAgentDashboard | BuyerDashboard;

export interface MeResponse {
  user: UserProfile;
  dashboard: DashboardData;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notif = inject(NotificationService);
  private authService = inject(AuthService);
  private readonly base = environment.apiUrl;

  private handleError(message: string) {
    return (err: any) => {
      this.notif.show(message, 'error');
      return throwError(() => err);
    };
  }

  // ── GET /users/me — returns user + role-specific dashboard ─────────────────
  getMe(): Observable<MeResponse> {
    return this.http.get<ApiResponse<MeResponse>>(`${this.base}/users/me`).pipe(
      map((res) => res.data),
      tap((data) => this.authService.setCurrentUser(data.user as any)),
      catchError(this.handleError('Failed to load profile'))
    );
  }

  // ── PATCH /users/me ────────────────────────────────────────────────────────
  updateMe(payload: FormData | Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<ApiResponse<{ user: UserProfile }>>(`${this.base}/users/me`, payload).pipe(
      map((res) => res.data.user),
      tap((user) => this.authService.setCurrentUser(user as any)),
      catchError(this.handleError('Failed to update profile'))
    );
  }

  // ── PATCH /users/change-password ───────────────────────────────────────────
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/users/change-password`, {
      currentPassword,
      newPassword,
    }).pipe(
      catchError(this.handleError('Failed to change password'))
    );
  }

  // ── Bookings ── GET /dashboard/me/bookings ───────────────────────────────
  getMyBookings(): Observable<any[]> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard/me/bookings`).pipe(
      map((res) => {
        if (Array.isArray(res.data)) return res.data;
        return res.data?.bookings ?? [];
      }),
      catchError(this.handleError('Failed to load bookings'))
    );
  }

  cancelBooking(bookingId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/bookings/${bookingId}/cancel`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to cancel booking'))
    );
  }

  // ── Properties (owner/agent) ── GET /properties/my ────────────────────────
  getMyProperties(): Observable<any[]> {
    return this.http.get<ApiResponse<any>>(`${this.base}/properties/my`).pipe(
      map((res) => {
        if (Array.isArray(res.data)) return res.data;
        return res.data?.properties ?? [];
      }),
      catchError(this.handleError('Failed to load properties'))
    );
  }

  // ── Upload property (owner/agent) ──────────────────────────────────────────
  createProperty(payload: FormData): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/properties`, payload).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to create property'))
    );
  }

  // ── Saved / Favourites (buyer) ── GET /dashboard/me/favorites ───────────
  getSavedProperties(): Observable<any[]> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard/me/favorites`).pipe(
      map((res) => {
        if (Array.isArray(res.data)) return res.data;
        return res.data?.favorites ?? [];
      }),
      catchError(this.handleError('Failed to load saved properties'))
    );
  }

  unsaveProperty(propertyId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.base}/favourites/${propertyId}`).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to remove saved property'))
    );
  }

  // ── Payments ── GET /dashboard/me/payments ───────────────────────────────
  getPayments(): Observable<any[]> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard/me/payments`).pipe(
      map((res) => {
        if (Array.isArray(res.data)) return res.data;
        return res.data?.payments ?? [];
      }),
      catchError(this.handleError('Failed to load payments'))
    );
  }

  // ── Stats ── GET /dashboard/me/stats ───────────────────────────────
  getMyStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/dashboard/me/stats`).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to load stats'))
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout(): Observable<any> {
    this.authService.logout();
    return new Observable(observer => {
      observer.next(undefined);
      observer.complete();
    });
  }
}
