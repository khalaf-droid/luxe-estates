import { Component, OnInit } from '@angular/core';
import { PropertiesService } from '../properties/services/properties.service';

@Component({
  selector: 'app-user-properties',
  templateUrl: './user-properties.component.html'
})
export class UserPropertiesComponent implements OnInit {
  properties: any[] = [];
  isLoading = false;

  constructor(private propertiesService: PropertiesService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.propertiesService.getMyProperties().subscribe({
      next: (data) => { this.properties = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  getApproval(p: any): string {
    return p.approvalStatus || p.isApproved === true ? 'approved' : p.isApproved === false ? 'rejected' : 'pending';
  }
}
