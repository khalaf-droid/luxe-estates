import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';

// ── Domain Models ──────────────────────────────────────────────

export interface AdminStats {
  users: number;
  properties: number;
  bookings: number;
  revenue: number;
}

export interface ActivityFeedItem {
  type: string;
  message: string;
  entityId: string;
  createdAt: string;
  colorCode: string;
}

export interface RevenueReportItem {
  _id: { year: number; month?: number };
  totalRevenue: number;
  count: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'owner' | 'agent' | 'admin';
  isBanned: boolean;
  isVerified: boolean;
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  photo: string | null;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export interface KycDocument {
  type: string;
  frontImage: string;
  backImage?: string;
  uploadedAt: string;
  _id?: string;
}

export interface KycSubmission {
  _id: string;
  name: string;
  email: string;
  kycStatus: string;
  kycDocuments: KycDocument[];
  ownershipDocuments?: { imageUrl: string; uploadedAt: string }[];
  kycSubmittedAt: string;
  kycApprovedAt?: string;
  createdAt?: string;
  kycRejectionReason?: string;
  kycAttempts: number;
}

export interface PaginatedKyc {
  users: KycSubmission[];
  total: number;
  page: number;
  pages: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ── Internal API shape ─────────────────────────────────────────

interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  data: T;
  message?: string;
}

// ── Service ────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private readonly base = environment.apiUrl;

  // ── Error Handler ──────────────────────────────────────────

  private handleError(defaultMessage: string) {
    return (err: any) => {
      const message = err.error?.message || defaultMessage;
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

  // ── Dashboard Overview ─────────────────────────────────────

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
          users:      res.data?.totalUsers     ?? 0,
          properties: res.data?.totalProperties ?? 0,
          bookings:   res.data?.totalBookings   ?? 0,
          revenue:    res.data?.totalRevenue    ?? 0,
        })),
        catchError(this.handleError('Failed to load dashboard stats'))
      );
  }

  getRecentTransactions(): Observable<any[]> {
    return this.http.get<ApiResponse<any[] | { payments: any[] }>>(`${this.base}/dashboard/admin/payments?limit=5`).pipe(
      map(this.unwrapList<any>('payments')),
      catchError(this.handleError('Failed to load recent transactions'))
    );
  }

  getSystemActivity(): Observable<ActivityFeedItem[]> {
    return this.http.get<ApiResponse<{ activities: ActivityFeedItem[] }>>(`${this.base}/dashboard/admin/activity?limit=5`).pipe(
      map((res) => res.data?.activities || []),
      catchError(this.handleError('Failed to load system activity'))
    );
  }

  getRevenueAnalytics(period: 'monthly' | 'yearly' = 'monthly'): Observable<RevenueReportItem[]> {
    return this.http.get<ApiResponse<{ report: RevenueReportItem[] }>>(`${this.base}/dashboard/admin/reports/revenue?period=${period}`).pipe(
      map((res) => res.data?.report || []),
      catchError(this.handleError('Failed to load revenue analytics'))
    );
  }

  // ── Users Management ───────────────────────────────────────

  getUsers(filters: UserFilters = {}): Observable<PaginatedUsers> {
    // Build params — remove empty/null keys
    const params: Record<string, any> = { limit: 20, ...filters };
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) {
        delete params[k];
      }
    });

    return this.http.get<any>(`${this.base}/dashboard/admin/users`, { params }).pipe(
      map((res) => ({
        users: res.data?.users || [],
        total: res.total        || 0,
        page:  res.page         || 1,
        pages: res.pages        || 1,
      })),
      catchError(this.handleError('Failed to load users'))
    );
  }

  updateUserRole(userId: string, role: string): Observable<AdminUser> {
    return this.http.patch<ApiResponse<{ user: AdminUser }>>(`${this.base}/dashboard/admin/users/${userId}/role`, { role }).pipe(
      map((res) => res.data?.user),
      catchError(this.handleError('Failed to update role'))
    );
  }

  toggleBanUser(userId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/dashboard/admin/users/${userId}/ban`, {}).pipe(
      map(res => res.data),
      catchError(this.handleError('Failed to toggle user ban status'))
    );
  }

  // ── KYC Management ──────────────────────────────────────────

  getKYCSummary(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/kyc/summary`).pipe(
      map(res => res.data),
      catchError(this.handleError('Failed to load KYC summary'))
    );
  }

  getKYCList(filters: any = {}): Observable<PaginatedKyc> {
    const params: Record<string, any> = { limit: 15, ...filters };
    // Clean empty values
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined || params[k] === 'all') {
        delete params[k];
      }
    });

    return this.http.get<any>(`${this.base}/kyc/list`, { params }).pipe(
      map((res) => ({
        users: res.data?.users || [],
        total: res.total || 0,
        page: res.page || 1,
        pages: res.pages || 1,
      })),
      catchError(this.handleError('Failed to load KYC list'))
    );
  }

  approveKYC(userId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/kyc/${userId}/approve`, {}).pipe(
      map(res => res.data),
      catchError(this.handleError('Failed to approve KYC'))
    );
  }

  rejectKYC(userId: string, reason: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/kyc/${userId}/reject`, { reason }).pipe(
      map(res => res.data),
      catchError(this.handleError('Failed to reject KYC'))
    );
  }

  revertToPendingKYC(userId: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/kyc/${userId}/revert`, {}).pipe(
      map(res => res.data),
      catchError(this.handleError('Failed to revert KYC status'))
    );
  }

  // ── Properties Management ──────────────────────────────────

  getProperties(filters: any = {}): Observable<any> {
    const params: Record<string, any> = { limit: 12, ...filters };
    // Clean empty values
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined || params[k] === 'all') {
        delete params[k];
      }
    });

    return this.http.get<any>(`${this.base}/dashboard/admin/properties`, { params }).pipe(
      map((res) => ({
        properties: res.data?.properties || [],
        total: res.total || 0,
        page: res.page || 1,
        pages: res.pages || 1,
      })),
      catchError(this.handleError('Failed to load properties'))
    );
  }

  updatePropertyApproval(propertyId: string, decision: 'approve' | 'reject'): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/dashboard/admin/properties/${propertyId}/${decision}`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to update property approval'))
    );
  }

  // ── Bookings Management ────────────────────────────────────

  getBookings(filters: any = {}): Observable<any> {
    const params: Record<string, any> = { limit: 15, ...filters };
    // Clean empty values
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined || params[k] === 'all') {
        delete params[k];
      }
    });

    return this.http.get<any>(`${this.base}/dashboard/admin/bookings`, { params }).pipe(
      map((res) => ({
        bookings: res.data?.bookings || [],
        total: res.total || 0,
        page: res.page || 1,
        pages: res.pages || 1,
      })),
      catchError(this.handleError('Failed to load bookings'))
    );
  }

  updateBookingStatus(bookingId: string, status: string): Observable<any> {
    const action = status === 'approved' ? 'approve' : 'reject';
    return this.http.patch<ApiResponse<any>>(`${this.base}/bookings/${bookingId}/${action}`, {}).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to update booking status'))
    );
  }

  bulkUpdateBookings(bookingIds: string[], status: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/bookings/admin/bulk-status`, { bookingIds, status }).pipe(
      map((res) => res.data),
      catchError(this.handleError('Failed to perform bulk update'))
    );
  }

  exportBookings(filters: any = {}): void {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] && filters[k] !== 'all') params.append(k, filters[k]);
    });
    
    // Direct window open or hidden link for download
    window.open(`${this.base}/bookings/admin/export?${params.toString()}`, '_blank');
  }
}
