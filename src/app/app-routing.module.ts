import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// ✅ استدعاء كومبوننت الترقية الجديد
import { BecomeAgentComponent } from './features/become-agent/become-agent.component';

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
  
  // ✅ إضافة المسار الجديد الخاص بصفحة الترقية (يجب أن يكون قبل مسار الـ Wildcard **)
  {
    path: 'become-agent',
    component: BecomeAgentComponent,
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