import { Component } from '@angular/core';
import { AuthService } from './core/auth/auth.service'; // استدعاء الـ Service

@Component({
  selector: 'app-root',
  template: `
    <app-cursor></app-cursor>
    <app-nav></app-nav>
    <router-outlet></router-outlet>
    <app-notification></app-notification>

    <app-auth-modal></app-auth-modal>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AppComponent {
  title = 'luxe-estates';

  // حقن الـ AuthService عشان نقدر نفتح المودال
  constructor(private auth: AuthService) {}

  // دالة مؤقتة لفتح المودال
  testOpenModal() {
    // استخدم الدالة اللي موجودة عندك في AuthService لفتح المودال
    // لو مفيهاش parameters سيبها فاضية () ولو بتاخد 'login' حطها
    this.auth.openModal(); 
  }
}