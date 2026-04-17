import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER — مينا: استبدلي الـ component ده بـ AuctionsComponent
// بتاعتك لما تخلصي شغلك، وامسحي الـ placeholder
// ─────────────────────────────────────────────────────────────
@Component({
  template: `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;background:#0A0A0F;color:#E74C3C;
                font-family:'Space Mono',monospace;font-size:14px;letter-spacing:2px;">
      AUCTIONS MODULE — جاهز لـ مينا ✦
    </div>
  `,
})
export class AuctionsPlaceholderComponent {}

const routes: Routes = [
  { path: '', component: AuctionsPlaceholderComponent },
];

@NgModule({
  declarations: [
    AuctionsPlaceholderComponent,
    // AuctionsComponent   ← مينا تضيف
    // CountdownPipe       ← مينا تضيف (تأكد pure: false)
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes), // ✅ forChild — لا تغيرها لـ forRoot أبداً
  ],
})
export class AuctionsModule {}
