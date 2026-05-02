import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, catchError, of, finalize } from 'rxjs';
import { KycService, KYCStatusResponse, KYCSubmission } from '../../core/services/kyc.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TitleCasePipe],
  templateUrl: './kyc.component.html',
  styleUrls: ['./kyc.component.scss']
})
export class KycComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private kycService = inject(KycService);
  private notificationService = inject(NotificationService);

  kycForm!: FormGroup;
  status: KYCStatusResponse | null = null;
  isLoading = false;
  isUploading = false;
  
  frontPreview: string | null = null;
  backPreview: string | null = null;
  selectedFrontFile: File | null = null;
  selectedBackFile: File | null = null;

  // New: Property Ownership Documents
  ownershipPreviews: string[] = [];
  selectedOwnershipFiles: File[] = [];

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    this.initForm();
    this.fetchStatus();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private initForm(): void {
    this.kycForm = this.fb.group({
      documentType: ['national_id', Validators.required],
      frontImage: [null, Validators.required],
      backImage: [null],
      ownershipDocs: [[]] // Track ownership document count or existence
    });

    // Handle Passport logic (back image not required)
    this.kycForm.get('documentType')?.valueChanges.subscribe(type => {
      const backImageControl = this.kycForm.get('backImage');
      if (type === 'passport') {
        backImageControl?.clearValidators();
      } else {
        backImageControl?.setValidators(Validators.required);
      }
      backImageControl?.updateValueAndValidity();
    });
  }

  private fetchStatus(): void {
    this.kycService.getKYCStatus().subscribe({
      next: (res) => {
        this.status = res;
        if (res.status === 'approved' || res.status === 'rejected') {
          this.pollSubscription?.unsubscribe();
        }
      },
      error: () => {
        // Fallback for initial state if 404 or error
        this.status = { success: true, status: 'not_submitted' };
      }
    });
  }

  private startPolling(): void {
    this.pollSubscription = this.kycService.pollStatus().subscribe(res => {
      this.status = res;
      if (res.status === 'approved' || res.status === 'rejected') {
        this.pollSubscription?.unsubscribe();
      }
    });
  }

  onFileSelected(event: any, side: 'front' | 'back' | 'ownership'): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (side === 'ownership') {
      // Handle multiple files for ownership
      Array.from(files as FileList).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = () => {
          this.ownershipPreviews.push(reader.result as string);
          this.selectedOwnershipFiles.push(file);
          this.kycForm.patchValue({ ownershipDocs: this.selectedOwnershipFiles });
        };
        reader.readAsDataURL(file);
      });
      return;
    }

    // Handle single files for ID
    const file = files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.notificationService.show('Please select an image file', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (side === 'front') {
          this.frontPreview = reader.result as string;
          this.selectedFrontFile = file;
          this.kycForm.patchValue({ frontImage: true });
        } else if (side === 'back') {
          this.backPreview = reader.result as string;
          this.selectedBackFile = file;
          this.kycForm.patchValue({ backImage: true });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeOwnershipFile(index: number): void {
    this.ownershipPreviews.splice(index, 1);
    this.selectedOwnershipFiles.splice(index, 1);
    this.kycForm.patchValue({ ownershipDocs: this.selectedOwnershipFiles });
  }

  async onSubmit(): Promise<void> {
    if (this.kycForm.invalid || !this.selectedFrontFile) return;

    this.isUploading = true;
    try {
      // 1. Upload Front Image
      const frontRes = await this.kycService.uploadImage(this.selectedFrontFile).toPromise();
      if (!frontRes?.success) throw new Error('Front image upload failed');

      let backImageUrl: string | undefined;
      // 2. Upload Back Image (if required)
      if (this.kycForm.get('documentType')?.value !== 'passport' && this.selectedBackFile) {
        const backRes = await this.kycService.uploadImage(this.selectedBackFile).toPromise();
        if (!backRes?.success) throw new Error('Back image upload failed');
        backImageUrl = backRes.url;
      }

      // 3. Upload Ownership Documents
      const ownershipUrls: string[] = [];
      for (const file of this.selectedOwnershipFiles) {
        const res = await this.kycService.uploadImage(file).toPromise();
        if (res?.success) ownershipUrls.push(res.url);
      }

      this.isUploading = false;
      this.isLoading = true;

      // 4. Submit KYC
      const submission: KYCSubmission = {
        documentType: this.kycForm.value.documentType,
        frontImage: frontRes.url,
        backImage: backImageUrl,
        ownershipDocuments: ownershipUrls.length > 0 ? ownershipUrls : undefined
      };

      this.kycService.submitKYC(submission).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.notificationService.show('Documents submitted successfully!', 'success');
          this.fetchStatus(); // Refresh status immediately
        },
        error: (err) => {
          this.notificationService.show(err.error?.message || 'Failed to submit documents', 'error');
        }
      });

    } catch (error: any) {
      this.isUploading = false;
      this.notificationService.show(error.message || 'Verification process failed', 'error');
    }
  }

  getStatusTitle(): string {
    switch (this.status?.status) {
      case 'approved': return 'Identity Verified';
      case 'pending': return 'Verification in Progress';
      case 'rejected': return 'Action Required: Verification Rejected';
      case 'not_submitted': return 'Verify Your Identity';
      default: return 'Verification Status';
    }
  }

  getStatusDescription(): string {
    switch (this.status?.status) {
      case 'approved': 
        return 'Your identity has been successfully confirmed. You have unlocked full access to all premium features.';
      case 'pending': 
        return 'Our compliance team is currently reviewing your documents. This usually takes 24–48 hours.';
      case 'rejected': 
        return 'Unfortunately, your submission did not meet our requirements. Please review the reason below and re-submit.';
      case 'not_submitted': 
        return 'To ensure a secure marketplace, we require all members to verify their identity before transacting.';
      default: 
        return 'Please provide valid government-issued identification.';
    }
  }
}
