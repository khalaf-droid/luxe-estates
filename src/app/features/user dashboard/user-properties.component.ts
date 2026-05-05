import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserDashboardService } from './user-dashboard.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-user-properties',
  templateUrl: './user-properties.component.html',
  styleUrls: ['./user-properties.component.scss']
})
export class UserPropertiesComponent implements OnInit, OnDestroy {
  properties: any[] = [];
  isLoading = false;
  showAddForm = false;
  isSubmitting = false;
  selectedFile: File | null = null;
  form!: FormGroup;

  // ── Subscription State ──
  plans: any[] = [];
  activeSub: any = null;
  isSubscribed = false;
  isAtLimit = false;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserDashboardService,
    private fb: FormBuilder,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.loadSubscriptionContext();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadSubscriptionContext(): void {
    this.userService.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((dash: any) => {
        if (dash) {
          const ownerDash = dash as any;
          this.activeSub = ownerDash.subscription;
          this.isSubscribed = !!this.activeSub;
          this.isAtLimit = this.activeSub && 
                          this.activeSub.listingsLimit !== -1 && 
                          this.activeSub.listingsUsed >= this.activeSub.listingsLimit;
        }
      });

    this.userService.getPlans()
      .pipe(takeUntil(this.destroy$))
      .subscribe(plans => this.plans = plans);
  }

  buildForm(): void {
    this.form = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price:       [null, [Validators.required, Validators.min(1)]],
      area:        [null],
      bedrooms:    [null],
      bathrooms:   [null],
      city:        ['', Validators.required],
      address:     [''],
      type:        ['apartment', Validators.required],
    });
  }

  load(): void {
    this.isLoading = true;
    this.userService.getMyProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.properties = data; this.isLoading = false; },
        error: () => { this.isLoading = false; },
      });
  }

  onSubscribe(planId: string): void {
    this.userService.subscribe(planId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notif.show('Subscription activated!', 'success');
          // Refresh everything
          this.userService.getMe().subscribe();
        }
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submitProperty(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;

    const fd = new FormData();
    const formValue = { ...this.form.value };

    // Map flat form fields to Property model's nested location structure
    if (formValue.city || formValue.address) {
      fd.append('location[city]', formValue.city || '');
      fd.append('location[street]', formValue.address || '');
      delete formValue.city;
      delete formValue.address;
    }

    Object.entries(formValue).forEach(([k, v]) => {
      if (v !== null && v !== '') fd.append(k, String(v));
    });
    if (this.selectedFile) fd.append('photo', this.selectedFile);

    this.userService.createProperty(fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notif.show('Property submitted for review!', 'success');
          this.isSubmitting = false;
          this.showAddForm = false;
          this.form.reset({ type: 'apartment' });
          this.selectedFile = null;
          this.load();
        },
        error: () => { this.isSubmitting = false; },
      });
  }

  getApproval(p: any): string {
    if (p.approvalStatus) return p.approvalStatus;
    if (p.isApproved === true) return 'approved';
    if (p.isApproved === false) return 'rejected';
    return 'pending';
  }
}
