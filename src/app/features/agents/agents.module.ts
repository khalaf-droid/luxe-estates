import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER — مينا: استبدلي الـ component ده بـ AgentsComponent
// بتاعتك لما تخلص شغلك، وامسحي الـ placeholder
// ─────────────────────────────────────────────────────────────
@Component({
  template: `
    <div style="display:flex;align-items:center;justify-content:center;
                height:100vh;background:#0A0A0F;color:#E74C3C;
                font-family:'Space Mono',monospace;font-size:14px;letter-spacing:2px;">
      AGENTS MODULE — جاهز لـ مينا ✦
    </div>
  `,
})
export class AgentsPlaceholderComponent {}

const routes: Routes = [
  { path: '', component: AgentsPlaceholderComponent },
];

@NgModule({
  declarations: [
    AgentsPlaceholderComponent,
    // AgentsComponent     ← مينا تضيف
    // AgentCardComponent  ← مينا تضيف
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes), // ✅ forChild — لا تغيرها لـ forRoot أبداً
  ],
})
export class AgentsModule {}
