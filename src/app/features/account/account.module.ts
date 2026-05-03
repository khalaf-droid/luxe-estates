import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account/account.component';
import { AccountOverviewComponent } from './components/account-overview/account-overview.component';
import { AccountSecurityComponent } from './components/account-security/account-security.component';
import { AccountPreferencesComponent } from './components/account-preferences/account-preferences.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AccountRoutingModule,
    AccountComponent,
    AccountOverviewComponent,
    AccountSecurityComponent,
    AccountPreferencesComponent
  ]
})
export class AccountModule { }
