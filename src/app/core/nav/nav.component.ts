import { Component, HostListener } from '@angular/core';
import { AuthService } from '../auth/auth.service'; // استدعاء ملف الـ auth

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  isScrolled = false;

  // ✅ 1. لازم نحقن الـ AuthService هنا عشان نقدر نستخدمه
  constructor(public auth: AuthService) {}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  // ✅ 2. دي الفانكشن اللي الزرار هينادي عليها عشان يفتح المودال
  openLogin(): void {
    this.auth.openModal(); 
  }
}