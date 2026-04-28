import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// ✅ استدعاء كومبوننت الترقية الجديد
import { BecomeAgentComponent } from './features/become-agent/become-agent.component';

import { authGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/hero/hero.module').then((m) => m.HeroModule),
  },
  {
    path: 'properties',
    loadChildren: () =>
      import('./features/properties/properties.module').then(
        (m) => m.PropertiesModule
      ),
  },
  {
    path: 'auctions',
    loadChildren: () =>
      import('./features/auctions/auctions.module').then(
        (m) => m.AuctionsModule
      ),
  },
  {
    path: 'agents',
    loadChildren: () =>
      import('./features/agents/agents.module').then((m) => m.AgentsModule),
  },
  
  {
    path: 'become-agent',
    component: BecomeAgentComponent,
  },

  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule)
  },

  // مسار إعادة تعيين كلمة المرور
  {
    path: 'reset-password/:token',
    loadComponent: () => import('./core/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  
  // مسار تأكيد الحساب (OTP)
  {
    path: 'verify-otp',
    loadComponent: () => import('./core/auth/otp-verify/otp-verify.component').then(m => m.OtpVerifyComponent)
  },

  // مسار الـ KYC
  {
    path: 'kyc',
    canActivate: [authGuard],
    loadComponent: () => import('./features/kyc/kyc.component').then(m => m.KycComponent)
  },

  // مسار الـ Wildcard لاصطياد أي روابط خاطئة (يجب أن يظل في النهاية دائمًا)
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}