import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  UserDashboardService,
  UserProfile,
  DashboardData,
  OwnerAgentDashboard,
  BuyerDashboard,
} from './user-dashboard.service';

@Component({
  selector: 'app-user-overview',
  templateUrl: './user-overview.component.html',
  styleUrls: ['./user-overview.component.scss']
})
export class UserOverviewComponent implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  dashboard: DashboardData | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.userService.getMe()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ user, dashboard }) => {
          this.user = user;
          this.dashboard = dashboard;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; },
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get isOwnerOrAgent(): boolean {
    return this.user?.role === 'owner' || this.user?.role === 'agent';
  }

  get isBuyer(): boolean {
    return this.user?.role === 'buyer';
  }

  get ownerDash(): OwnerAgentDashboard {
    return this.dashboard as OwnerAgentDashboard;
  }

  get buyerDash(): BuyerDashboard {
    return this.dashboard as BuyerDashboard;
  }
}
