import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { UserDashboardComponent }  from './user-dashboard.component';
import { UserOverviewComponent }   from './user-overview.component';
import { UserBookingsComponent }   from './user-bookings.component';
import { UserPropertiesComponent } from './user-properties.component';
import { UserSavedComponent }      from './user-saved.component';
import { UserPaymentsComponent }   from './user-payments.component';
import { UserProfileComponent }    from './user-profile.component';

const routes: Routes = [
  {
    path: '',
    component: UserDashboardComponent,
    children: [
      { path: '',           redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview',   component: UserOverviewComponent   },
      { path: 'bookings',   component: UserBookingsComponent   },
      { path: 'properties', component: UserPropertiesComponent },
      { path: 'saved',      component: UserSavedComponent      },
      { path: 'payments',   component: UserPaymentsComponent   },
      { path: 'profile',    component: UserProfileComponent    },
    ],
  },
];

@NgModule({
  declarations: [
    UserDashboardComponent,
    UserOverviewComponent,
    UserBookingsComponent,
    UserPropertiesComponent,
    UserSavedComponent,
    UserPaymentsComponent,
    UserProfileComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class UserDashboardModule {}
