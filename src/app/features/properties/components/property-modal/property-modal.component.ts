// ─────────────────────────────────────────────────────────────────────────────
// LUXE ESTATES — Property Modal Component
// Visual reference: Template/index.html — .prop-modal-overlay (lines 1104–1150)
// Task 06: Schedule Viewing + Make Inquiry with auth guard + reactive forms
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Property } from '../../models/property.model';
import { PropertiesService } from '../../services/properties.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';

// ── Which inline form is currently visible ────────────────────────────────────
type ActiveForm = 'none' | 'viewing' | 'inquiry';

@Component({
  selector: 'app-property-modal',
  templateUrl: './property-modal.component.html',
  styleUrls: ['./property-modal.component.scss'],
})
export class PropertyModalComponent implements OnInit, OnDestroy {

  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  @Input() property!: Property;
  @Output() closed = new EventEmitter<void>();

  // ── Animation state ───────────────────────────────────────────────────────
  isActive   = false;

  // ── Form state ────────────────────────────────────────────────────────────
  activeForm: ActiveForm = 'none';
  isSubmitting           = false;

  viewingForm!: FormGroup;
  inquiryForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private propertiesService: PropertiesService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Entry animation — next frame so CSS transition fires correctly
    requestAnimationFrame(() => { this.isActive = true; });

    // ── Reactive forms (Style B inputs per coding-rules.md §3.5) ─────────
    this.viewingForm = this.fb.group({
      date: ['', Validators.required],
    });

    this.inquiryForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── ESC key closes modal — Template lines 2388–2394 ──────────────────────
  @HostListener('document:keydown.escape')
  onEscKey(): void { this.close(); }

  // ── Close ─────────────────────────────────────────────────────────────────
  close(): void {
    this.isActive = false;
    setTimeout(() => this.closed.emit(), 400);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('prop-modal-overlay')) {
      this.close();
    }
  }

  // ── Price ─────────────────────────────────────────────────────────────────
  get formattedPrice(): string {
    return this.propertiesService.formatPrice(
      this.property.price,
      this.property.currency,
      this.property.status
    );
  }

  // ── Images ────────────────────────────────────────────────────────────────
  get mainImage():  string | null { return this.property.images?.[0] ?? null; }
  get sideImage1(): string | null { return this.property.images?.[1] ?? null; }
  get sideImage2(): string | null { return this.property.images?.[2] ?? null; }

  // ── Min date for date picker (today) ─────────────────────────────────────
  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TASK 06 — Auth-gated action buttons
  // Same guard pattern as Task 05 onFavoriteToggled()
  // ─────────────────────────────────────────────────────────────────────────

  // ── SCHEDULE VIEWING button ───────────────────────────────────────────────
  onScheduleViewingClick(): void {
    // Auth guard — exact pattern from task requirement
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to schedule a viewing', 'info');
      return;
    }

    // Toggle: show form or hide if already open
    this.activeForm = this.activeForm === 'viewing' ? 'none' : 'viewing';
  }

  // ── Submit viewing form ───────────────────────────────────────────────────
  submitViewing(): void {
    if (this.viewingForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const date = this.viewingForm.get('date')!.value as string;

    // POST /api/viewings — method already in PropertiesService (Task 01)
    this.propertiesService
      .scheduleViewing(this.property._id, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe((success) => {
        this.isSubmitting = false;
        if (success) {
          this.notificationService.show(
            'Viewing scheduled! Our agent will confirm shortly.',
            'success'
          );
          this.activeForm = 'none';
          this.viewingForm.reset();
        } else {
          this.notificationService.show('Failed to schedule. Try again.', 'error');
        }
      });
  }

  // ── MAKE INQUIRY button ───────────────────────────────────────────────────
  onMakeInquiryClick(): void {
    // Auth guard — same pattern
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to send an inquiry', 'info');
      return;
    }

    // Toggle: show form or hide if already open
    this.activeForm = this.activeForm === 'inquiry' ? 'none' : 'inquiry';
  }

  // ── Submit inquiry form ───────────────────────────────────────────────────
  submitInquiry(): void {
    if (this.inquiryForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const message = (this.inquiryForm.get('message')!.value as string).trim();

    // Validate message is not empty (redundant safety check after Validators.required)
    if (!message) {
      this.notificationService.show('Message cannot be empty', 'error');
      this.isSubmitting = false;
      return;
    }

    // POST /api/inquiries — method already in PropertiesService (Task 01)
    this.propertiesService
      .makeInquiry(this.property._id, message)
      .pipe(takeUntil(this.destroy$))
      .subscribe((success) => {
        this.isSubmitting = false;
        if (success) {
          this.notificationService.show('Inquiry sent!', 'success');
          this.activeForm = 'none';
          this.inquiryForm.reset();
        } else {
          this.notificationService.show('Failed to send. Try again.', 'error');
        }
      });
  }
}
