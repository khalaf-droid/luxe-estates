import { Component, HostListener, inject } from '@angular/core';
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
  showDropdown = false;
  currentTheme$ = this.themeService.theme$;

  constructor(
    public auth: AuthService, 
    private router: Router,
    private themeService: ThemeService
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  onLogout(): void {
    this.auth.logout();
    this.showDropdown = false;
    this.router.navigate(['/']);
  }

  onListPropertyClick(): void {
    const currentUser = this.auth.currentUser$.getValue();

    if (!currentUser) {
      this.auth.openModal();
    } else if (currentUser.role === 'buyer') {
      this.router.navigate(['/become-agent']);
    } else if (currentUser.role === 'owner' || currentUser.role === 'agent') {
      this.router.navigate(['/add-property']);
    }
  }

  openLogin(): void {
    this.auth.openModal();
  }

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