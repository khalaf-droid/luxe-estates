import { Component, OnInit } from '@angular/core';
import { UserDashboardService } from './user-dashboard.service';

@Component({
  selector: 'app-user-properties',
  templateUrl: './user-properties.component.html'
})
export class UserPropertiesComponent implements OnInit {
  properties: any[] = [];
  isLoading = false;

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.userService.getMyProperties().subscribe({
      next: (data) => { this.properties = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  getApproval(p: any): string {
    return p.approvalStatus || p.isApproved === true ? 'approved' : p.isApproved === false ? 'rejected' : 'pending';
  }
}
