import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserDashboardService } from './user-dashboard.service';

@Component({
  selector: 'app-user-payments',
  templateUrl: './user-payments.component.html',
  styleUrls: ['./user-payments.component.scss']
})
export class UserPaymentsComponent implements OnInit, OnDestroy {
  payments: any[] = [];
  isLoading = true;
  hasError = false;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.hasError = false;
    this.userService.getPayments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.payments = data; this.isLoading = false; },
        error: () => { this.isLoading = false; this.hasError = true; },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get totalPaid(): number {
    return this.payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  }

  get completedCount(): number {
    return this.payments.filter((p) => p.status === 'completed').length;
  }

  propertyTitle(p: any): string {
    return p.property?.title ?? p.booking?.property_id?.title ?? p.booking?.property?.title ?? 'N/A';
  }
}
