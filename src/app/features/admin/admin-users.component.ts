import { Component, OnInit } from '@angular/core';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  isLoading = false;
  activeUserId: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleAdmin(user: any): void {
    if (!user?._id) {
      return;
    }

    const newRole = user.role === 'admin' ? 'buyer' : 'admin';
    this.activeUserId = user._id;

    this.adminService.updateUserRole(user._id, newRole).subscribe({
      next: () => {
        this.activeUserId = null;
        this.loadUsers();
      },
      error: () => {
        this.activeUserId = null;
      }
    });
  }
}
