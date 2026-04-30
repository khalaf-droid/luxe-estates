import { Component, OnInit } from '@angular/core';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin-properties',
  templateUrl: './admin-properties.component.html',
  styleUrls: ['./admin-properties.component.scss']
})
export class AdminPropertiesComponent implements OnInit {
  properties: any[] = [];
  isLoading = false;
  activePropertyId: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.adminService.getProperties().subscribe({
      next: (data) => {
        this.properties = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  updateApproval(property: any, decision: 'approve' | 'reject'): void {
    if (!property?._id) {
      return;
    }

    this.activePropertyId = property._id;
    this.adminService.updatePropertyApproval(property._id, decision).subscribe({
      next: () => {
        this.activePropertyId = null;
        this.loadProperties();
      },
      error: () => {
        this.activePropertyId = null;
      }
    });
  }

  getApprovalStatus(property: any): string {
    return property.approvalStatus || property.status || 'pending';
  }
}
