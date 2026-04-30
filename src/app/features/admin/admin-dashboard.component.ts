import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AdminService, AdminStats } from './admin.service';

interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

interface DashboardQueue {
  eyebrow: string;
  title: string;
  description: string;
  route: string;
  cta: string;
  badge: 'gold' | 'emerald' | 'crimson';
  badgeText: string;
}

interface DashboardViewModel {
  metrics: DashboardMetric[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  private readonly fallbackStats: AdminStats = {
    users: 0,
    properties: 0,
    bookings: 0,
    revenue: 0,
  };

  readonly queues: DashboardQueue[] = [
    {
      eyebrow: 'Access',
      title: 'Users',
      description: 'Review account status, permissions, and admin access.',
      route: '/admin/users',
      cta: 'Manage Users',
      badge: 'gold',
      badgeText: 'Roles',
    },
    {
      eyebrow: 'Catalog',
      title: 'Properties',
      description: 'Approve listings and keep the luxury inventory polished.',
      route: '/admin/properties',
      cta: 'Review Listings',
      badge: 'emerald',
      badgeText: 'Listings',
    },
    {
      eyebrow: 'Operations',
      title: 'Bookings',
      description: 'Track booking activity and handle open reservation flow.',
      route: '/admin/bookings',
      cta: 'Open Bookings',
      badge: 'crimson',
      badgeText: 'Live',
    },
  ];

  readonly vm$: Observable<DashboardViewModel>;

  constructor(private adminService: AdminService) {
    this.vm$ = this.adminService.getStats().pipe(
      startWith(this.fallbackStats),
      catchError(() => of(this.fallbackStats)),
      map((stats) => ({ metrics: this.createMetrics(stats) }))
    );
  }

  private createMetrics(stats: AdminStats): DashboardMetric[] {
    return [
      {
        label: 'Users',
        value: stats.users.toLocaleString(),
        helper: 'Registered accounts',
      },
      {
        label: 'Properties',
        value: stats.properties.toLocaleString(),
        helper: 'Managed listings',
      },
      {
        label: 'Bookings',
        value: stats.bookings.toLocaleString(),
        helper: 'Reservation records',
      },
      {
        label: 'Revenue',
        value: this.formatPrice(stats.revenue),
        helper: 'Paid transactions',
      },
      {
        label: 'Status',
        value: 'Live',
        helper: 'Mock fallback ready',
      },
    ];
  }

  private formatPrice(price: number): string {
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  }
}
