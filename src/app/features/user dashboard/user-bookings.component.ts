import { Component, OnInit } from '@angular/core';
import { BookingsService } from '../bookings/bookings.service';
import { UserDashboardService } from './user-dashboard.service';

@Component({
  selector: 'app-user-bookings',
  templateUrl: './user-bookings.component.html'
})
export class UserBookingsComponent implements OnInit {
  bookings: any[] = [];
  isLoading = false;
  activeId: string | null = null;
  filter = 'all';

  constructor(
    private bookingsService: BookingsService,
    private paymentService: UserDashboardService // Keep this for payments for now
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.bookingsService.getMyBookings().subscribe({
      next: (res) => { 
        this.bookings = res.data?.bookings || res.bookings || res; 
        this.isLoading = false; 
      },
      error: () => { this.isLoading = false; }
    });
  }

  get filtered(): any[] {
    return this.filter === 'all'
      ? this.bookings
      : this.bookings.filter((b) => b.status === this.filter);
  }

  pay(booking: any): void {
    if (!booking?._id) return;
    this.paymentService.initiatePayment(booking._id).subscribe({
      next: (res) => {
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          this.load();
        }
      },
      error: () => {}
    });
  }

  cancel(booking: any): void {
    if (!booking?._id) return;
    this.activeId = booking._id;
    this.bookingsService.cancelBooking(booking._id).subscribe({
      next: () => { this.activeId = null; this.load(); },
      error: () => { this.activeId = null; }
    });
  }
}
