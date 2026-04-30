import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { UserDashboardComponent } from './user-dashboard.component';
import { UserOverviewComponent } from './user-overview.component';
import { UserBookingsComponent } from './user-bookings.component';
import { UserPropertiesComponent } from './user-properties.component';
import { UserProfileComponent } from './user-profile.component';
import { UserPaymentsComponent } from './user-payments.component';

const routes: Routes = [
  {
    path: '',
    component: UserDashboardComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: UserOverviewComponent },
      { path: 'bookings', component: UserBookingsComponent },
      { path: 'properties', component: UserPropertiesComponent },
      { path: 'profile', component: UserProfileComponent },
      { path: 'payments', component: UserPaymentsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    UserDashboardComponent,
    UserOverviewComponent,
    UserBookingsComponent,
    UserPropertiesComponent,
    UserProfileComponent,
    UserPaymentsComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class UserDashboardModule {}
