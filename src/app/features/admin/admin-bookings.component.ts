import { Component, OnInit, HostListener } from '@angular/core';
import { AdminService } from './admin.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-admin-bookings',
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['./admin-bookings.component.scss']
})
export class AdminBookingsComponent implements OnInit {
  bookings: any[] = [];
  isLoading = true;
  selectedBooking: any = null;
  selectedIds = new Set<string>();

  // Smart Insights
  insights = {
    atRisk: 0,
    highValue: 0,
    pendingToday: 0
  };

  filters = {
    search: '',
    status: 'all',
    sort: '-created_at',
    page: 1,
    limit: 10
  };

  pagination = {
    total: 0,
    pages: 1,
    pageArray: [] as number[]
  };

  private searchSubject = new Subject<string>();

  constructor(
    private adminService: AdminService,
    private notification: NotificationService
  ) {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1; // Reset to page 1 on search
      this.loadBookings();
    });
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.selectedBooking || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    if (event.key.toLowerCase() === 'a') this.confirmAction('approved');
    else if (event.key.toLowerCase() === 'r') this.confirmAction('rejected');
    else if (event.key === 'ArrowDown') this.navigateSelection('next');
    else if (event.key === 'ArrowUp') this.navigateSelection('prev');
    else if (event.key === 'Escape') this.closeDetail();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.adminService.getBookings(this.filters).subscribe({
      next: (res) => {
        this.bookings = res.bookings;
        this.pagination.total = res.total;
        this.pagination.pages = res.pages;
        this.pagination.pageArray = Array.from({ length: res.pages }, (_, i) => i + 1);
        this.calculateInsights();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination.pages) return;
    this.filters.page = page;
    this.loadBookings();
  }

  calculateInsights(): void {
    this.insights.atRisk = this.bookings.filter(b => b.payment?.status === 'failed').length;
    this.insights.highValue = this.bookings.filter(b => b.amount > 50000 && b.status === 'pending').length;
    this.insights.pendingToday = this.bookings.filter(b => b.status === 'pending').length;
  }

  onFilterChange(): void {
    this.searchSubject.next(this.filters.search);
  }

  selectBooking(booking: any): void {
    this.selectedBooking = booking;
  }

  closeDetail(): void {
    this.selectedBooking = null;
  }

  // ── Smart Operations Logic ──────────────────────────────────
  
  confirmAction(status: 'approved' | 'rejected'): void {
    if (!this.selectedBooking) return;

    if (status === 'rejected') {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason === null) return; // User cancelled
      this.performUpdate(status, reason);
    } else {
      if (confirm(`Are you sure you want to APPROVE booking #${this.selectedBooking._id.slice(-7).toUpperCase()}?`)) {
        this.performUpdate(status);
      }
    }
  }

  private performUpdate(status: 'approved' | 'rejected', reason: string = ''): void {
    const booking = this.selectedBooking;
    const originalStatus = booking.status;

    // OPTIMISTIC UPDATE
    booking.status = status;
    this.notification.show(`Processing ${status}...`, 'info');

    this.adminService.updateBookingStatus(booking._id, status).subscribe({
      next: () => {
        this.notification.show(`Booking #${booking._id.slice(-7)} ${status} successfully`, 'success');
        this.autoAdvance();
      },
      error: (err) => {
        // ROLLBACK on failure
        booking.status = originalStatus;
        const msg = err.status === 409 ? 'This booking was already modified by another admin.' : 'Failed to update status.';
        this.notification.show(msg, 'error');
        this.loadBookings(); // Sync with server
      }
    });
  }

  autoAdvance(): void {
    const idx = this.bookings.findIndex(b => b._id === this.selectedBooking._id);
    if (idx !== -1 && idx < this.bookings.length - 1) {
      this.selectedBooking = this.bookings[idx + 1];
    } else {
      this.closeDetail();
    }
  }

  navigateSelection(dir: 'next' | 'prev'): void {
    const idx = this.bookings.findIndex(b => b._id === this.selectedBooking?._id);
    if (dir === 'next' && idx < this.bookings.length - 1) this.selectedBooking = this.bookings[idx + 1];
    else if (dir === 'prev' && idx > 0) this.selectedBooking = this.bookings[idx - 1];
  }

  // ── Bulk & Export ───────────────────────────────────────────
  
  toggleSelection(id: string): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
  }

  toggleAll(): void {
    if (this.selectedIds.size === this.bookings.length) this.selectedIds.clear();
    else this.bookings.forEach(b => this.selectedIds.add(b._id));
  }

  exportData(): void {
    this.adminService.exportBookings(this.filters);
  }

  bulkUpdate(status: string): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Apply ${status.toUpperCase()} to ${this.selectedIds.size} bookings?`)) return;

    this.adminService.bulkUpdateBookings(Array.from(this.selectedIds), status).subscribe({
      next: (res) => {
        this.notification.show(res.message, 'success');
        this.selectedIds.clear();
        this.loadBookings();
      }
    });
  }
}
