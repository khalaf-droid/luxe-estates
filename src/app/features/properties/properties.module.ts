import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { PropertyCardComponent }    from './components/property-card/property-card.component';
import { PropertiesPageComponent }  from './components/properties-page/properties-page.component';
import { PropertyModalComponent }   from './components/property-modal/property-modal.component';

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
const routes: Routes = [
  { path: '', component: PropertiesPageComponent },
];

// ─────────────────────────────────────────────────────────────────────────────
// Module
// ─────────────────────────────────────────────────────────────────────────────
@NgModule({
  declarations: [
    PropertiesPageComponent,
    PropertyCardComponent,
    PropertyModalComponent,   // ✅ Task 04
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes), // ✅ forChild — never forRoot
  ],
})
export class PropertiesModule {}
