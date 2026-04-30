import { Component, OnInit } from '@angular/core';
import { UserDashboardService } from './user-dashboard.service';

@Component({
  selector: 'app-user-payments',
  templateUrl: './user-payments.component.html'
})
export class UserPaymentsComponent implements OnInit {
  payments: any[] = [];
  isLoading = false;

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userService.getPayments().subscribe({
      next: (data) => { this.payments = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get total(): number {
    return this.payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);
  }
}
