import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER — اريني: استبدلي الـ component ده بـ HeroComponent
// بتاعتك لما تخلصي شغلك، وامسحي الـ placeholder
// ─────────────────────────────────────────────────────────────
@Component({
  template: `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;background:#0A0A0F;color:#C9A96E;
                font-family:'Space Mono',monospace;font-size:14px;letter-spacing:2px;">
      HERO SECTION — جاهز لـ اريني ✦
    </div>
  `,
})
export class HeroPlaceholderComponent {}

const routes: Routes = [
  { path: '', component: HeroPlaceholderComponent },
];

@NgModule({
  declarations: [HeroPlaceholderComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes), // ✅ forChild — لا تغيرها لـ forRoot أبداً
  ],
})
export class HeroModule {}
