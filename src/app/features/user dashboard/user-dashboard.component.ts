import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserDashboardService, UserProfile } from './user-dashboard.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserDashboardComponent implements OnInit {
  user: UserProfile | null = null;

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (profile) => (this.user = profile),
      error: () => {}
    });
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
