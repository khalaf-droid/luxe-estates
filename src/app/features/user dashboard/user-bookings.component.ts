import { Component, OnInit } from '@angular/core';
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

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.userService.getMyBookings().subscribe({
      next: (data) => { this.bookings = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get filtered(): any[] {
    return this.filter === 'all'
      ? this.bookings
      : this.bookings.filter((b) => b.status === this.filter);
  }

  cancel(booking: any): void {
    if (!booking?._id) return;
    this.activeId = booking._id;
    this.userService.cancelBooking(booking._id).subscribe({
      next: () => { this.activeId = null; this.load(); },
      error: () => { this.activeId = null; }
    });
  }
}
