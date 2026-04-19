import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth.service';

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const isStrong = value.length >= 8 &&
      /[A-Z]/.test(value) && /[a-z]/.test(value) &&
      /[0-9]/.test(value) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    return !isStrong ? { strongPassword: true } : null;
  };
}

export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  };
}

type AuthTab = 'login' | 'register' | 'forgot' | 'otp' | 'reset';
type UserRole = 'Buyer' | 'Seller' | 'Agent' | 'Investor';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
})
export class AuthModalComponent implements OnInit, OnDestroy {

  private auth = inject(AuthService);
  private fb   = inject(FormBuilder);

  isOpen    = false;
  activeTab: AuthTab = 'login';
  isLoading = false;
  errorMsg  = '';

  readonly roles: UserRole[] = ['Buyer', 'Seller', 'Agent', 'Investor'];

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotForm!: FormGroup;
  otpForm!: FormGroup;
  resetForm!: FormGroup;

  resetEmail: string = '';
  expectedOtp: string = '';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.buildForms();
    this.auth.isModalOpen$.pipe(takeUntil(this.destroy$)).subscribe(open => this.isOpen = open);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$';

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.pattern(emailRegex)]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      name:            ['', Validators.required],
      email:           ['', [Validators.required, Validators.pattern(emailRegex)]],
      password:        ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', Validators.required],
      role:            ['Buyer', Validators.required],
    }, { validators: passwordsMatchValidator() });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(emailRegex)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]]
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatchValidator() });
  }

  switchTab(tab: AuthTab): void {
    this.activeTab = tab;
    this.errorMsg = '';
  }

  // ── OTP Flow Logic ─────────────────────────────────────────────

  goForgot(): void {
    this.switchTab('forgot');
  }

  onForgotSubmit(): void {
    if (this.forgotForm.invalid) { this.forgotForm.markAllAsTouched(); return; }
    
    const email = this.forgotForm.value.email;
    
    if (this.auth.checkEmailExists(email)) {
      this.resetEmail = email;
      
      // ✅ تثبيت الكود لـ 1234 عشان تعرف تتست الفرونت إند، لإن مفيش باك إند يبعت إيميل حقيقي
      this.expectedOtp = '1234'; 
      
      // ✅ الإشعار هيقولك راجع إيميلك بس
      this.showNotification(`OTP sent successfully to ${email}`, 'success');
      this.switchTab('otp');
    } else {
      this.errorMsg = 'No account found with that email address.';
    }
  }

  onOtpSubmit(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    
    if (this.otpForm.value.otp === this.expectedOtp) {
      this.switchTab('reset');
      this.showNotification('OTP Verified Successfully', 'success');
    } else {
      this.errorMsg = 'Invalid OTP code. Please try again.';
    }
  }

  onResetSubmit(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    
    this.auth.updatePassword(this.resetEmail, this.resetForm.value.password);
    
    this.showNotification('Password updated successfully!', 'success');
    this.loginForm.patchValue({ email: this.resetEmail });
    
    this.resetEmail = '';
    this.expectedOtp = '';
    this.forgotForm.reset();
    this.otpForm.reset();
    this.resetForm.reset();
    this.switchTab('login');
  }

  // ── Auth Logic ────────────────────────────────────────────────
  
  onLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: any) => {
        this.isLoading = false;
        this.showNotification(`Welcome back, ${user.name}!`, 'success');
        this.close();
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Invalid email or password. Please try again.';
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    const { name, email, password, role } = this.registerForm.value;

    this.auth.register(name, email, password, role).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: any) => {
        this.isLoading = false;
        this.showNotification(`Account created successfully! Welcome ${user.name}`, 'success');
        this.registerForm.reset({ role: 'Buyer' }); 
        this.loginForm.patchValue({ email: email });
        this.switchTab('login');
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Registration failed. Email already exists.';
      }
    });
  }

  close(): void { this.auth.closeModal(); }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('auth-overlay')) this.close();
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const el = document.createElement('div');
    const isSuccess = type === 'success';
    const borderColor = isSuccess ? '#27AE60' : '#C9A96E'; 
    const icon = isSuccess ? '✓' : 'ℹ';

    el.className = 'luxe-toast';
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: rgba(10, 10, 15, 0.98);
      border: 1px solid #333; border-left: 3px solid ${borderColor}; color: #FAFAF8;
      padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
      min-width: 320px; z-index: 100000; font-family: 'DM Sans', sans-serif;
      font-size: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: slideInRight 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    `;

    el.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="color: ${borderColor}; font-weight: bold; font-size: 16px;">${icon}</span>
        <span>${message}</span>
      </div>
      <button class="toast-close-btn" style="background: none; border: none; color: #888; font-size: 16px; cursor: pointer;">✕</button>
    `;

    document.body.appendChild(el);

    if (!document.getElementById('luxe-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'luxe-toast-styles';
      style.innerHTML = `
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(20px); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    const closeBtn = el.querySelector('.toast-close-btn');
    closeBtn?.addEventListener('click', () => {
      el.style.animation = 'fadeOutRight 0.3s forwards';
      setTimeout(() => el.remove(), 300);
    });

    setTimeout(() => {
      if (document.body.contains(el)) {
        el.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => el.remove(), 300);
      }
    }, 4000);
  }
}