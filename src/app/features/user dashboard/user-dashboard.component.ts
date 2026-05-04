import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserDashboardService, UserProfile, UserRole } from './user-dashboard.service';

import { AuthService, User } from '../../core/auth/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  isLoggingOut = false;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserDashboardService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Load profile if not already in memory
    if (!this.authService.currentUser) {
      this.userService.getMe().pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitials(user: User | null): string {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  getRoleLabel(user: User | null): string {
    const map: Record<string, string> = {
      buyer: 'Buyer',
      owner: 'Owner',
      agent: 'Agent',
      admin: 'Admin',
    };
    return user?.role ? map[user.role] : '';
  }

  // Show "My Properties" nav link for owners and agents only
  canListProperties(user: User | null): boolean {
    return user?.role === 'owner' || user?.role === 'agent';
  }

  // Show "Saved" nav link for buyers and admins
  canViewSaved(user: User | null): boolean {
    return user?.role === 'buyer' || user?.role === 'admin';
  }

  logout(): void {
    if (this.isLoggingOut) return;
    this.isLoggingOut = true;
    this.userService.logout().subscribe({
      error: () => (this.isLoggingOut = false),
    });
  }
}
