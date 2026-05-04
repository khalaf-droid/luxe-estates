import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserDashboardService } from './user-dashboard.service';

@Component({
  selector: 'app-user-bookings',
  templateUrl: './user-bookings.component.html',
  styleUrls: ['./user-bookings.component.scss']
})
export class UserBookingsComponent implements OnInit, OnDestroy {
  bookings: any[] = [];
  isLoading = true;
  hasError = false;
  activeId: string | null = null;
  filter = 'all';
  private destroy$ = new Subject<void>();

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.userService.getMyBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.bookings = data; this.isLoading = false; },
        error: () => { this.isLoading = false; this.hasError = true; },
      });
  }

  get filtered(): any[] {
    return this.filter === 'all'
      ? this.bookings
      : this.bookings.filter((b) => b.status === this.filter);
  }

  // Property title — handles both populated and flat structures
  propertyTitle(b: any): string {
    return b.property?.title ?? b.property_id?.title ?? 'N/A';
  }

  cancel(booking: any): void {
    if (!booking?._id || this.activeId) return;
    this.activeId = booking._id;
    this.userService.cancelBooking(booking._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.activeId = null; this.load(); },
        error: () => { this.activeId = null; },
      });
  }

  canCancel(b: any): boolean {
    return b.status !== 'cancelled' && b.status !== 'rejected';
  }
}
