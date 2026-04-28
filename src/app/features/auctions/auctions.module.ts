// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Auctions Module
// Author: مينا — feature/mina-auctions
// ─────────────────────────────────────────────────────────────────────────────

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AuctionsComponent } from './auctions.component';
import { CountdownPipe } from '../../shared/pipes/countdown.pipe';

const routes: Routes = [
  { path: '', component: AuctionsComponent },
];

@NgModule({
  declarations: [
    AuctionsComponent,
    CountdownPipe,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),  // ← forChild, NOT forRoot
    ReactiveFormsModule,
  ],
  exports: [
    CountdownPipe,
  ],
})
export class AuctionsModule {}
