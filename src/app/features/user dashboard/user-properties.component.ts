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
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserDashboardService,
    private fb: FormBuilder,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

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
    Object.entries(this.form.value).forEach(([k, v]) => {
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
