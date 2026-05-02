import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { AccountOverviewComponent } from './components/account-overview/account-overview.component';
import { AccountSecurityComponent } from './components/account-security/account-security.component';
import { AccountPreferencesComponent } from './components/account-preferences/account-preferences.component';

const routes: Routes = [
  {
    path: '',
    component: AccountComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AccountOverviewComponent },
      { path: 'security', component: AccountSecurityComponent },
      { path: 'preferences', component: AccountPreferencesComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
