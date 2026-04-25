import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth.service';
import { ModalEscapeService } from '../../services/modal-escape.service';

// ─── Custom Validators (متحققات مخصصة) ──────────────────────────────────

// 1. التحقق من قوة كلمة المرور (لازم 8 حروف، حرف كبير، صغير، رقم، ورمز)
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const isStrong = value.length >= 8 &&
      /[A-Z]/.test(value) && /[a-z]/.test(value) &&
      /[0-9]/.test(value) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    // لو الباسورد ضعيف بنرجع إيرور اسمه strongPassword، لو قوي بنرجع null (سليم)
    return !isStrong ? { strongPassword: true } : null;
  };
}

// 2. التحقق من تطابق كلمتي المرور في شاشة التسجيل
export function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // لو مش متطابقين، بنحط الإيرور على حقل confirmPassword تحديداً عشان يظهر تحته رسالة الغلط
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  };
}

// ─── Component Setup ──────────────────────────────────────────────────

// تحديد التابات المتاحة في المودال عشان نمنع أي أخطاء إملائية في الكود
type AuthTab = 'login' | 'register' | 'forgot' | 'verify-otp';

@Component({
  selector: 'app-auth-modal',
  standalone: true, // بنستخدم Standalone Component عشان يكون خفيف وسريع
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
})
export class AuthModalComponent implements OnInit, OnDestroy {

  // حقن الخدمات (Dependency Injection) بالطريقة الحديثة في Angular
  private auth          = inject(AuthService);
  private fb            = inject(FormBuilder);
  private modalEscape   = inject(ModalEscapeService); // ESC global bus

  // ─── State Variables (متغيرات الحالة) ───
  isOpen    = false;           // للتحكم في ظهور أو إخفاء المودال
  activeTab: AuthTab = 'login'; // التاب المفتوح حالياً (افتراضياً تسجيل الدخول)
  isLoading = false;           // لتشغيل الأنيميشن بتاع التحميل جوه الزرار
  errorMsg  = '';              // لعرض رسائل الخطأ العامة (زي: الإيميل مسجل مسبقاً)

  // ─── Forms (تعريف الفورمز) ───
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotForm!: FormGroup;
  verifyOtpForm!: FormGroup;

  // ─── Verification State ───
  registeredEmail: string = ''; // الايميل الخاص بالـ user المسجل عشان نفعله

  // Subject لإنهاء الاشتراكات (Subscriptions) لما الكومبوننت يتقفل عشان نمنع تسريب الميموري
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.buildForms(); // أول ما المودال يفتح، بنبني الفورمز

    // بنراقب خدمة الـ Auth عشان نعرف إمتى نظهر أو نخفي المودال
    this.auth.isModalOpen$.pipe(takeUntil(this.destroy$)).subscribe(open => this.isOpen = open);

    // Subscribe to global ESC bus — only closes when this modal is actually open.
    // close() → AuthService.closeModal() → isModalOpen$ emits false → isOpen = false.
    // body.style.overflow is reset inside AuthService.closeModal() indirectly via
    // AuthModalComponent reacting to isOpen = false (overlay *ngIf removal).
    this.modalEscape.escape$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isOpen) this.close();
      });
  }

  ngOnDestroy(): void {
    // تنظيف الميموري لما الكومبوننت يتم تدميره
    this.destroy$.next();
    this.destroy$.complete();
  }

  // دالة بناء الفورمز وربطها بالـ Validators
  private buildForms(): void {
    // Regex قوي للتأكد إن الإيميل مكتوب بصيغة صحيحة (زي name@domain.com)
    const emailRegex = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$';

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.pattern(emailRegex)]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      name:            ['', Validators.required],
      email:           ['', [Validators.required, Validators.pattern(emailRegex)]],
      password:        ['', [Validators.required, strongPasswordValidator()]], // استخدام الـ Validator المخصص
      confirmPassword: ['', Validators.required],
      // 💡 ملحوظة: تم حذف حقل الـ Role من هنا لتسهيل التسجيل على المستخدم
    }, { validators: passwordsMatchValidator() }); // التأكد من تطابق الباسوردين

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(emailRegex)]]
    });

    this.verifyOtpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]] // رمز التأكيد بيكون 6 أرقام من الباك إند
    });
  }

  // دالة للتنقل بين التابات (Login, Register, OTP...)
  switchTab(tab: AuthTab): void {
    this.activeTab = tab;
    this.errorMsg = ''; // بنمسح أي إيرور قديم لما اليوزر يغير التاب
  }

  // ─── Forgot Password Flow ──────────────────────────────────────────

  // 1. الانتقال لشاشة نسيان الباسورد
  goForgot(): void {
    this.switchTab('forgot');
  }

  // 2. إرسال الإيميل لطلب رابط التغيير
  onForgotSubmit(): void {
    if (this.forgotForm.invalid) { this.forgotForm.markAllAsTouched(); return; } 
    this.isLoading = true;
    this.errorMsg = '';
    
    const email = this.forgotForm.value.email;
    
    this.auth.forgotPassword(email).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.showNotification(`If registered, a reset link was sent to ${email}`, 'info');
        this.switchTab('login');
      },
      error: () => {
        this.isLoading = false;
        // لدواعي أمنية بنظهر نفس الرسالة حتى لو الايميل مش موجود
        this.showNotification(`If registered, a reset link was sent to ${email}`, 'info');
        this.switchTab('login');
      }
    });
  }

  // ─── Auth Logic (تسجيل الدخول وإنشاء حساب) ─────────────────────
  
  onLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: any) => {
        this.isLoading = false;
        this.showNotification(`Welcome back, ${user.name}!`, 'success');
        this.close(); // لو النجاح، بنقفل المودال خالص
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Invalid email or password. Please try again.';
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    
    const { name, email, password } = this.registerForm.value;

    // 🔒 SECURITY FIX: The 'role' is strictly managed by the backend to prevent privilege escalation.
    // The frontend only sends user credentials; the backend securely assigns the default 'buyer' role.
    this.auth.register(name, email, password).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: any) => {
        this.isLoading = false;
        this.showNotification(`Account created! Please check your email to verify your account.`, 'info');
        this.registeredEmail = email; // نحفظ الإيميل للتفعيل
        this.registerForm.reset(); 
        this.switchTab('verify-otp'); // بننقله لتأكيد الحساب بدلاً من تسجيل الدخول مباشرة
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  // التحقق من الإيميل باستخدام كود التفعيل
  onVerifyOtpSubmit(): void {
    if (this.verifyOtpForm.invalid) { this.verifyOtpForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMsg = '';
    
    const otp = this.verifyOtpForm.value.otp;
    
    this.auth.verifyAccount(this.registeredEmail, otp).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.showNotification('Email verified successfully! You can now login.', 'success');
        this.loginForm.patchValue({ email: this.registeredEmail }); // تجهيز الإيميل للوجين
        this.registeredEmail = '';
        this.verifyOtpForm.reset();
        this.switchTab('login'); // بعد التفعيل بنوديه للوجين عشان يدخل
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Invalid or expired OTP.';
      }
    });
  }

  // ─── UI Helpers (دوال مساعدة للواجهة) ─────────────────────

  close(): void { this.auth.closeModal(); }

  // دالة لقفل المودال لو اليوزر داس في المساحة الفاضية براه
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('auth-overlay')) this.close();
  }

  // دالة للتحقق لو الحقل فيه خطأ وتم لمسه (عشان نظهر الرسالة الحمراء في الـ HTML)
  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  // ─── Custom Toast Notification (إشعار منبثق احترافي) ───
  // تم تصميمه برمجياً عشان ميعتمدش على مكاتب خارجية ويطابق الـ Design System
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const el = document.createElement('div');
    
    // الألوان معتمدة من ملف coding-rules.md
    const colorEmerald = '#27AE60'; // للنجاح
    const colorCrimson = '#C0392B'; // للأخطاء
    const colorGold    = '#C9A96E'; // للمعلومات
    
    let borderColor = colorEmerald;
    let icon = '✓';

    if (type === 'error') {
      borderColor = colorCrimson;
      icon = '✕';
    } else if (type === 'info') {
      borderColor = colorGold;
      icon = 'ℹ';
    }

    el.className = 'luxe-toast';
    // التنسيق (مكانه فوق يمين حسب البند 3.9)
    el.style.cssText = `
      position: fixed; top: 100px; right: 24px; background: rgba(10, 10, 15, 0.98);
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

    // إضافة الأنيميشن للصفحة لو مش موجود
    if (!document.getElementById('luxe-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'luxe-toast-styles';
      style.innerHTML = `
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(20px); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    // قفل الإشعار يدوياً
    const closeBtn = el.querySelector('.toast-close-btn');
    closeBtn?.addEventListener('click', () => {
      el.style.animation = 'fadeOutRight 0.3s forwards';
      setTimeout(() => el.remove(), 300);
    });

    // قفل الإشعار تلقائياً بعد 4 ثواني
    setTimeout(() => {
      if (document.body.contains(el)) {
        el.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => el.remove(), 300);
      }
    }, 4000);
  }
}