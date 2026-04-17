import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER — خلف: استبدل الـ component ده بـ PropertiesComponent
// بتاعك لما تخلص شغلك، وامسح الـ placeholder
// ─────────────────────────────────────────────────────────────
@Component({
  template: `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;background:#0A0A0F;color:#27AE60;
                font-family:'Space Mono',monospace;font-size:14px;letter-spacing:2px;">
      PROPERTIES MODULE — جاهز لـ خلف ✦
    </div>
  `,
})
export class PropertiesPlaceholderComponent {}

const routes: Routes = [
  { path: '', component: PropertiesPlaceholderComponent },
];

@NgModule({
  declarations: [
    PropertiesPlaceholderComponent,
    // PropertiesComponent      ← خلف يضيف
    // PropertyCardComponent    ← خلف يضيف
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes), // ✅ forChild — لا تغيرها لـ forRoot أبداً
  ],
})
export class PropertiesModule {}
