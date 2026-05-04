import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
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
  stats: any = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    forkJoin({
      me: this.userService.getMe(),
      stats: this.userService.getMyStats().pipe(catchError(() => of(null)))
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ me, stats }) => {
          this.user = me.user;
          this.dashboard = me.dashboard;
          this.stats = stats;
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

  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  get ownerDash(): OwnerAgentDashboard {
    return this.dashboard as OwnerAgentDashboard;
  }

  get buyerDash(): BuyerDashboard {
    return this.dashboard as BuyerDashboard;
  }

  get adminDash(): any {
    return this.dashboard;
  }
}
