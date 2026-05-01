import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { ModalEscapeService } from '../../services/modal-escape.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { environment } from '../../../../environments/environment';

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
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private modalEscape = inject(ModalEscapeService); // ESC global bus
  private notificationSvc = inject(NotificationService); // §5.5

  // ─── State Variables (متغيرات الحالة) ───
  isOpen = false;           // للتحكم في ظهور أو إخفاء المودال
  activeTab: AuthTab = 'login'; // التاب المفتوح حالياً (افتراضياً تسجيل الدخول)
  isLoading = false;           // لتشغيل الأنيميشن بتاع التحميل جوه الزرار
  isGoogleLoading = false;
  errorMsg = '';              // لعرض رسائل الخطأ العامة (زي: الإيميل مسجل مسبقاً)

  // Guard: true only when a real (non-placeholder) Google Client ID is set
  readonly isGoogleConfigured = environment.googleClientId !== 'your_google_client_id_here'
    && environment.googleClientId.trim().length > 0;

  // ─── Forms (تعريف الفورمز) ───
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotForm!: FormGroup;
  verifyOtpForm!: FormGroup;

  // ─── Verification State ───
  registeredEmail: string = ''; // الايميل الخاص بالـ user المسجل عشان نفعله
  otpInputs = [0, 1, 2, 3, 4, 5];

  // ─── Password UI State ───
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  isRequirementsExpanded = false;

  // Subject لإنهاء الاشتراكات (Subscriptions) لما الكومبوننت يتقفل عشان نمنع تسريب الميموري
  private destroy$ = new Subject<void>();
  private googleAccountsInitialized = false;
  private readonly googleIdentityScript = 'https://accounts.google.com/gsi/client';
  private readonly fallbackGoogleClientId = '668341342866-ufmo1js3tbrv5nkeakgtn81kjsp9r3if.apps.googleusercontent.com';

  private get googleClientId(): string {
    return environment.googleClientId?.trim() || this.fallbackGoogleClientId;
  }

  private get effectiveGoogleClientId(): string {
    return this.googleClientId === '' ? this.fallbackGoogleClientId : this.googleClientId;
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src="' + this.googleIdentityScript + '"]') as HTMLScriptElement | null;
      if (existingScript) {
        if ((window as any).google?.accounts?.id) {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = this.googleIdentityScript;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
      document.head.appendChild(script);
    });
  }

  private initGoogleAccounts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        reject(new Error('google.accounts.id is not available. The Google Identity script may not be loaded.'));
        return;
      }

      if (this.googleAccountsInitialized) {
        resolve();
        return;
      }

      google.accounts.id.initialize({
        client_id: this.effectiveGoogleClientId,
        callback: (response: any) => this.handleGoogleCredentialResponse(response),
        ux_mode: 'popup',
        itp_support: true // ✅ Fixes Incognito & FedCM browser blocks
      });

      this.googleAccountsInitialized = true;
      resolve();
    });
  }

  private handleGoogleCredentialResponse(response: any): void {
    if (this.isGoogleLoading) return; // Prevent multiple calls
    if (!response?.credential) {
      this.isGoogleLoading = false;
      this.notificationSvc.show('Google sign-in did not return a valid credential.', 'error');
      return;
    }

    this.isGoogleLoading = true;

    this.auth.loginWithGoogle(response.credential)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isGoogleLoading = false;
          const userName = res?.data?.user?.name || 'there';
          this.notificationSvc.show(`Welcome, ${userName}! Signed in with Google.`, 'success');
          this.close();
        },
        error: (err: any) => {
          this.isGoogleLoading = false;
          console.error('[Frontend-Google-Error]:', err);
          console.error('[Frontend-Google-Error-Body]:', err.error);
          const msg = err.error?.message || 'Google sign-in failed. Please try again.';
          this.notificationSvc.show(msg, 'error');
          this.errorMsg = msg;
        }
      });
  }

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
      email: ['', [Validators.required, Validators.pattern(emailRegex)]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(emailRegex)]],
      password: ['', [Validators.required, strongPasswordValidator()]], // استخدام الـ Validator المخصص
      confirmPassword: ['', Validators.required],
      // 💡 ملحوظة: تم حذف حقل الـ Role من هنا لتسهيل التسجيل على المستخدم
    }, { validators: passwordsMatchValidator() }); // التأكد من تطابق الباسوردين

    // Subscribe to password changes to calculate strength
    this.registerForm.get('password')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.passwordStrength = this.calculateStrength(value);
    });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(emailRegex)]]
    });

    this.verifyOtpForm = this.fb.group({
      otp0: ['', [Validators.required, Validators.maxLength(1)]],
      otp1: ['', [Validators.required, Validators.maxLength(1)]],
      otp2: ['', [Validators.required, Validators.maxLength(1)]],
      otp3: ['', [Validators.required, Validators.maxLength(1)]],
      otp4: ['', [Validators.required, Validators.maxLength(1)]],
      otp5: ['', [Validators.required, Validators.maxLength(1)]]
    });
  }

  // ─── Password Helpers ──────────────────────────────────────────────
  togglePasswordVisibility(field: 'login' | 'register' | 'confirm'): void {
    if (field === 'login') this.showLoginPassword = !this.showLoginPassword;
    else if (field === 'register') this.showRegisterPassword = !this.showRegisterPassword;
    else if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleRequirements(): void {
    this.isRequirementsExpanded = !this.isRequirementsExpanded;
  }

  private calculateStrength(value: string): number {
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) score++;
    return score;
  }

  get passwordHasLength(): boolean {
    return (this.registerForm?.get('password')?.value || '').length >= 8;
  }
  get passwordHasCase(): boolean {
    const val = this.registerForm?.get('password')?.value || '';
    return /[A-Z]/.test(val) && /[a-z]/.test(val);
  }
  get passwordHasNumber(): boolean {
    const val = this.registerForm?.get('password')?.value || '';
    return /[0-9]/.test(val);
  }
  get passwordHasSpecial(): boolean {
    const val = this.registerForm?.get('password')?.value || '';
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
  }

  getStrengthLabel(): string {
    if (!this.registerForm?.get('password')?.value) return '';
    switch (this.passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  }

  getStrengthColorClass(): string {
    switch (this.passwordStrength) {
      case 1: return 'text-red';
      case 2: return 'text-orange';
      case 3: return 'text-yellow';
      case 4: return 'text-green';
      default: return '';
    }
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
        this.notificationSvc.show(`If registered, a reset link was sent to ${email}`, 'info');
        this.switchTab('login');
      },
      error: () => {
        this.isLoading = false;
        // لدواعي أمنية بنظهر نفس الرسالة حتى لو الايميل مش موجود
        this.notificationSvc.show(`If registered, a reset link was sent to ${email}`, 'info');
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
      next: (res: any) => {
        this.isLoading = false;
        // Fix: Properly extract the user's name from the raw HTTP response object
        const userName = res?.data?.user?.name || res?.user?.name || 'there';
        this.notificationSvc.show(`Welcome back, ${userName}!`, 'success');
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
        this.notificationSvc.show(`Account created! Please check your email to verify your account.`, 'info');
        this.registeredEmail = email; // نحفظ الإيميل للتفعيل
        this.registerForm.reset();

        // Navigate to OTP verification page
        this.close();
        this.router.navigate(['/verify-otp'], { queryParams: { email } });
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

    const val = this.verifyOtpForm.value;
    const otp = `${val.otp0}${val.otp1}${val.otp2}${val.otp3}${val.otp4}${val.otp5}`;

    if (otp.length !== 6) {
      this.errorMsg = 'Please enter all 6 digits.';
      this.isLoading = false;
      return;
    }

    this.auth.verifyAccount(this.registeredEmail, otp).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationSvc.show('Email verified successfully! You can now login.', 'success');
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

  // ─── OTP Helpers ──────────────────────────────────────────────────
  onOtpInput(event: any, index: number): void {
    const value = event.target.value;
    if (value.length >= 1 && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && index > 0) {
      const input = event.target as HTMLInputElement;
      if (input.value === '') {
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        if (prevInput) prevInput.focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text/plain') || '';
    const numbersOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (numbersOnly.length > 0) {
      const chars = numbersOnly.split('');
      const patchObj: any = {};
      chars.forEach((char, i) => {
        patchObj[`otp${i}`] = char;
      });
      this.verifyOtpForm.patchValue(patchObj);

      const focusIndex = Math.min(chars.length, 5);
      const nextInput = document.getElementById(`otp-${focusIndex}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  // ─── Google Sign-In Handler (Task 1.4) ────────────────────────────────────
  onGoogleSignIn(): void {
    if (!this.isGoogleConfigured) {
      this.notificationSvc.show(
        'Google Sign-In is not configured yet. Set GOOGLE_CLIENT_ID in environment.ts.',
        'error'
      );
      return;
    }

    if (this.isGoogleLoading) return;
    this.isGoogleLoading = true;
    this.errorMsg = '';

    this.loadGoogleScript()
      .then(() => this.initGoogleAccounts())
      .then(() => {
        const google = (window as any).google;
        if (!google?.accounts?.id) {
          throw new Error('Google Identity Services have not been initialized.');
        }

        google.accounts.id.prompt();
      })
      .catch((err: any) => {
        this.isGoogleLoading = false;

        if (!environment.production) {
          console.error('[GoogleAuth] initialization failed:', err);
        }

        this.notificationSvc.show(
          'Google Sign-In failed to initialize. Ensure your Google Client ID is configured and the browser allows cookies.',
          'error'
        );
      });
  }

}