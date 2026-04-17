import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
