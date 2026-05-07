import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  isScrolled = false;
  showDropdown = false; // إسلام: حالة القائمة المنسدلة

  get theme$() {
    return this.themeService.theme$;
  }

  // إسلام: حقن الخدمات باستخدام constructor
  constructor(
    public auth: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  // إسلام: دالة التبديل لإظهار/إخفاء القائمة المنسدلة
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  // إسلام: تسجيل الخروج وتصفير الحالة
  onLogout(): void {
    this.auth.logout();
    this.showDropdown = false;
    this.router.navigate(['/']);
  }

  // إسلام: دالة ذكية للتحكم في زر إضافة العقار بناءً على الصلاحيات
  onListPropertyClick(): void {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      // لو مفيش يوزر مسجل دخول، افتح مودال اللوجين
      this.auth.openModal();
    } else if (currentUser.role === 'buyer') {
      // لو مشتري عادي، وجهه لصفحة الترقية
      this.router.navigate(['/become-agent']);
    } else if (currentUser.role === 'owner' || currentUser.role === 'agent') {
      // لو بائع، وجهه لصفحة إضافة العقار
      this.router.navigate(['/add-property']);
    }
  }

  // إسلام: دالة فتح مودال التسجيل
  openLogin(): void {
    this.auth.openModal();
  }

  // ✅ 3. Mobile Menu Logic
  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}