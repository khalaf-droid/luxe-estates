import { Component, OnInit } from '@angular/core';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin-bookings',
  templateUrl: './admin-bookings.component.html',
  styleUrls: ['./admin-bookings.component.scss']
})
export class AdminBookingsComponent implements OnInit {
  bookings: any[] = [];
  isLoading = false;
  activeBookingId: string | null = null;
  bookingFilter = 'all';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.adminService.getBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get filteredBookings(): any[] {
    if (this.bookingFilter === 'all') {
      return this.bookings;
    }
    return this.bookings.filter((booking) => booking.status === this.bookingFilter);
  }

  changeBookingStatus(booking: any, status: string): void {
    if (!booking?._id) {
      return;
    }

    this.activeBookingId = booking._id;
    this.adminService.updateBookingStatus(booking._id, status).subscribe({
      next: () => {
        this.activeBookingId = null;
        this.loadBookings();
      },
      error: () => {
        this.activeBookingId = null;
      }
    });
  }
}
