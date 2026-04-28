import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth.service';
import { strongPasswordValidator, passwordsMatchValidator } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resetForm!: FormGroup;
  token: string | null = null;
  isLoading = false;
  errorMsg = '';
  successMsg = '';
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.errorMsg = 'Invalid reset link. Missing token.';
    }

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatchValidator() });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.resetForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) { 
      this.resetForm.markAllAsTouched(); 
      return; 
    }
    
    this.isLoading = true;
    this.errorMsg = '';
    
    const password = this.resetForm.value.password;
    
    this.auth.resetPassword(this.token, password).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Password reset successfully! Redirecting to home...';
        setTimeout(() => {
          this.router.navigate(['/']);
          this.auth.openModal('login');
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Failed to reset password. Link may be expired.';
      }
    });
  }
}
