import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserDashboardService, UserProfile } from './user-dashboard.service';

export const DASHBOARD_CONFIG = {
  buyer: [
    { id: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-line', link: 'overview' },
    { id: 'bookings', label: 'My Bookings', icon: 'fa-solid fa-calendar-check', link: 'bookings' },
    { id: 'favorites', label: 'Favorites', icon: 'fa-solid fa-heart', link: 'favorites' }
  ],
  owner: [
    { id: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-line', link: 'overview' },
    { id: 'properties', label: 'My Properties', icon: 'fa-solid fa-building', link: 'properties' },
    { id: 'bookings', label: 'Property Bookings', icon: 'fa-solid fa-book-open', link: 'bookings' },
    { id: 'earnings', label: 'Earnings', icon: 'fa-solid fa-wallet', link: 'payments' }
  ],
  agent: [
    { id: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-line', link: 'overview' },
    { id: 'properties', label: 'Managed Properties', icon: 'fa-solid fa-building', link: 'properties' },
    { id: 'leads', label: 'Leads', icon: 'fa-solid fa-users', link: 'leads' }
  ]
};

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  dashboardTabs: any[] = [];

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.setupDashboardTabs();
      },
      error: () => {}
    });
  }

  setupDashboardTabs(): void {
    if (!this.user) return;
    const role = this.user.role as keyof typeof DASHBOARD_CONFIG;
    this.dashboardTabs = DASHBOARD_CONFIG[role] || DASHBOARD_CONFIG['buyer'];
  }

  get initials(): string {
    if (!this.user?.name) return '?';
    return this.user.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }
}
