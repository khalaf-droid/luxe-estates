import { Component, OnInit } from '@angular/core';
import { UserDashboardService, UserProfile } from './user-dashboard.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  user: UserProfile | null = null;
  isLoading = false;
  isSaving = false;

  form = { name: '', phone: '' };

  constructor(
    private userService: UserDashboardService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.form.name = u.name || '';
        this.form.phone = u.phone || '';
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  save(): void {
    this.isSaving = true;
    this.userService.updateProfile(this.form).subscribe({
      next: (updated) => {
        this.user = updated;
        this.notif.show('Profile updated successfully', 'success');
        this.isSaving = false;
      },
      error: () => { this.isSaving = false; }
    });
  }

  get initials(): string {
    if (!this.user?.name) return '?';
    return this.user.name.split(' ').slice(0, 2).map((n) => n[0].toUpperCase()).join('');
  }
}
