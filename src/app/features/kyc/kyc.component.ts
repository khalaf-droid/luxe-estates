import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { KycService, KYCStatusResponse, KYCSubmission, KYCOwnershipDoc, FullKYCResponse } from '../../core/services/kyc.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';

interface OwnershipUploadEntry {
  name: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  file?: File;
}

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
  private authService = inject(AuthService);

  kycForm!: FormGroup;
  status: KYCStatusResponse | null = null;
  
  // Loading States
  isInitialLoading = true; // SSoT initial fetch
  isLoading = false;       // Submit button loading
  isUploading = false;     // Image upload loading
  showRevertWarning = false; // Custom modal for revert warning

  // Profile photo from AuthService
  userPhoto: string | null = null;
  userName: string = '';

  frontPreview: string | null = null;
  backPreview: string | null = null;
  selectedFrontFile: File | null = null;
  selectedBackFile: File | null = null;

  // Ownership Documents — stored in DB immediately on upload
  ownershipDocs: KYCOwnershipDoc[] = [];     // DB-synced list with _id
  isDeletingOwnership: boolean[] = [];        // per-file delete loading state

  // Per-file upload tracking
  fileUploadQueue: OwnershipUploadEntry[] = [];
  isUploadingOwnership = false;

  private pollSubscription?: Subscription;

  ngOnInit(): void {
    this.initForm();
    this.loadConsolidatedData();
    // Load user photo for the banner
    const user = this.authService.currentUser;
    if (user) {
      this.userPhoto = user.photo || null;
      this.userName = user.name || '';
    }
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private initForm(): void {
    this.kycForm = this.fb.group({
      documentType: ['national_id', Validators.required],
      frontImage: [null],
      backImage: [null],
      ownershipDocs: [[]] // Track ownership document count or existence
    });
    
    // Listen to changes to switch images if needed, but no strict validation
    this.kycForm.get('documentType')?.valueChanges.subscribe(type => {
      // Force state separation to prevent carrying over images (hallucination fix)
      this.frontPreview = null;
      this.backPreview = null;
      this.selectedFrontFile = null;
      this.selectedBackFile = null;
      this.kycForm.patchValue({ frontImage: null, backImage: null });
      this.kycForm.get('frontImage')?.markAsUntouched();
      this.kycForm.get('backImage')?.markAsUntouched();
      
      this.kycForm.get('backImage')?.updateValueAndValidity();
    });
  }

  /**
   * Single Source of Truth Loader
   * Handles initial state and sets up polling from the same source
   */
  private loadConsolidatedData(): void {
    this.isInitialLoading = true;
    
    this.kycService.getMyKYCData().pipe(
      finalize(() => this.isInitialLoading = false)
    ).subscribe({
      next: (res: FullKYCResponse) => {
        this.applyKYCData(res);
        this.startConsolidatedPolling();
      },
      error: () => {
        this.isInitialLoading = false;
        this.status = { success: true, status: 'not_submitted' };
      }
    });
  }

  private startConsolidatedPolling(): void {
    this.pollSubscription = this.kycService.pollFullData().subscribe({
      next: (res: FullKYCResponse) => this.applyKYCData(res)
    });
  }

  private applyKYCData(res: FullKYCResponse): void {
    const kycInfo = res.data.kycInfo;
    
    // 1. Sync Status
    this.status = {
      success: true,
      status: kycInfo.status,
      reason: kycInfo.rejectionReason,
      ownershipDocuments: kycInfo.ownershipDocuments
    };

    // 2. Sync Identity Docs (Front/Back)
    if (kycInfo.documents && kycInfo.documents.length > 0) {
      const idDoc = kycInfo.documents[0];
      if (this.kycForm.get('documentType')?.value === 'national_id' || !this.kycForm.get('documentType')?.touched) {
         this.kycForm.patchValue({ documentType: idDoc.type });
      }
      if (idDoc.frontImage && !this.selectedFrontFile) {
        this.frontPreview = idDoc.frontImage;
        this.kycForm.patchValue({ frontImage: true });
      }
      if (idDoc.backImage && !this.selectedBackFile) {
        this.backPreview = idDoc.backImage;
        this.kycForm.patchValue({ backImage: true });
      }
    }

    // 3. Sync Ownership Docs (if not currently uploading/deleting)
    if (!this.isUploadingOwnership && !this.isDeletingOwnership.some(v => v)) {
      this.ownershipDocs = kycInfo.ownershipDocuments || [];
      this.isDeletingOwnership = new Array(this.ownershipDocs.length).fill(false);
    }

    // Stop polling if finalized (approved). Allow polling if rejected or pending to reflect changes.
    if (kycInfo.status === 'approved') {
      this.pollSubscription?.unsubscribe();
    }
  }

  private loadExistingData(): void {
    // Removed in favor of loadConsolidatedData
  }

  private startPolling(): void {
    // Removed in favor of startConsolidatedPolling
  }

  onFileSelected(event: any, side: 'front' | 'back'): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Client-side validation: Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.show('Image is too large (max 5MB)', 'error');
      return;
    }

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
      } else {
        this.backPreview = reader.result as string;
        this.selectedBackFile = file;
        this.kycForm.patchValue({ backImage: true });
      }
    };
    reader.readAsDataURL(file);
  }

  // ── Ownership Documents (immediate upload to DB) ──────────────────────────

  onOwnershipFileSelected(event: any): void {
    const files = event.target.files as FileList;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      // Client-side validation: Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.show(`File “${file.name}” is too large (max 5MB)`, 'error');
        return;
      }

      // Add to queue with uploading state
      const queueEntry: OwnershipUploadEntry = { name: file.name, status: 'uploading', file };
      this.fileUploadQueue.push(queueEntry);
      this.isUploadingOwnership = true;

      this.kycService.uploadOwnershipFile(file).subscribe({
        next: (res: any) => {
          const doc = res.data.document;
          this.ownershipDocs.push(doc);
          this.isDeletingOwnership.push(false);

          // Update queue entry to success
          queueEntry.status = 'success';
          this.isUploadingOwnership = this.fileUploadQueue.some((e: OwnershipUploadEntry) => e.status === 'uploading');
          this.notificationService.show(`“${doc.fileName}” uploaded & saved`, 'success');
        },
        error: (err: any) => {
          queueEntry.status = 'error';
          queueEntry.error = err.error?.message || 'Upload failed';
          this.isUploadingOwnership = this.fileUploadQueue.some((e: OwnershipUploadEntry) => e.status === 'uploading');
          this.notificationService.show(queueEntry.error!, 'error');
        }
      });
    });
    event.target.value = '';
  }

  retryUpload(queueIndex: number): void {
    const entry = this.fileUploadQueue[queueIndex];
    if (!entry?.file || entry.status !== 'error') return;

    entry.status = 'uploading';
    entry.error = undefined;
    this.isUploadingOwnership = true;

    this.kycService.uploadOwnershipFile(entry.file).subscribe({
      next: (res) => {
        const doc = res.data.document;
        this.ownershipDocs.push(doc);
        this.isDeletingOwnership.push(false);
        entry.status = 'success';
        this.isUploadingOwnership = this.fileUploadQueue.some(e => e.status === 'uploading');
        this.notificationService.show(`“${doc.fileName}” uploaded & saved`, 'success');
      },
      error: (err: any) => {
        entry.status = 'error';
        entry.error = err.error?.message || 'Upload failed';
        this.isUploadingOwnership = this.fileUploadQueue.some((e: OwnershipUploadEntry) => e.status === 'uploading');
      }
    });
  }

  deleteOwnershipFile(localIndex: number): void {
    const doc = this.ownershipDocs[localIndex];
    if (!doc?._id) return;

    this.isDeletingOwnership[localIndex] = true;

    this.kycService.deleteOwnershipFile(doc._id).subscribe({
      next: () => {
        this.ownershipDocs.splice(localIndex, 1);
        this.isDeletingOwnership.splice(localIndex, 1);
        this.notificationService.show('Document removed from database', 'success');
      },
      error: (err: any) => {
        this.isDeletingOwnership[localIndex] = false;
        this.notificationService.show(err.error?.message || 'Failed to delete document', 'error');
      }
    });
  }

  getFileIcon(fileType?: string): string {
    switch (fileType) {
      case 'pdf': return 'fa-file-pdf';
      case 'doc': return 'fa-file-word';
      default: return 'fa-file-image';
    }
  }

  getFileIconColor(fileType?: string): string {
    switch (fileType) {
      case 'pdf': return '#e74c3c';
      case 'doc': return '#2980b9';
      default: return '#C9A96E';
    }
  }

  removeImage(side: 'front' | 'back'): void {
    const isPersistent = side === 'front' ? !!this.frontPreview && !this.selectedFrontFile : !!this.backPreview && !this.selectedBackFile;

    if (side === 'front') {
      this.frontPreview = null;
      this.selectedFrontFile = null;
      this.kycForm.patchValue({ frontImage: null });
      this.kycForm.get('frontImage')?.markAsUntouched();
    } else {
      this.backPreview = null;
      this.selectedBackFile = null;
      this.kycForm.patchValue({ backImage: null });
      this.kycForm.get('backImage')?.markAsUntouched();
    }

    // If we removed a persistent image (one that was already in the DB),
    // we must notify the backend to clear the identity documents.
    if (isPersistent) {
      this.kycService.deleteIdentityDocument().subscribe({
        next: () => {
          this.notificationService.show('Identity documents removed from database', 'info');
        },
        error: (err: any) => {
          this.notificationService.show(err.error?.message || 'Failed to remove from database', 'error');
        }
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.kycForm.invalid) return;

    // Safety Warning: Prevent accidental full revert
    const hasFrontImage = this.selectedFrontFile || this.frontPreview;
    const hasOwnershipDocs = this.ownershipDocs && this.ownershipDocs.length > 0;
    
    if (!hasFrontImage && !hasOwnershipDocs) {
      this.showRevertWarning = true;
      return;
    }

    await this.processSubmission();
  }

  cancelRevert(): void {
    this.showRevertWarning = false;
  }

  async confirmRevert(): Promise<void> {
    this.showRevertWarning = false;
    await this.processSubmission();
  }

  private async processSubmission(): Promise<void> {
    this.isUploading = true;
    try {
      let frontImageUrl: string | undefined = '';
      if (this.selectedFrontFile) {
        console.log('[KYC] Uploading front image...');
        const frontRes = await firstValueFrom(this.kycService.uploadImage(this.selectedFrontFile));
        if (!frontRes?.success) throw new Error('Front image upload failed');
        frontImageUrl = frontRes.url;
        console.log('[KYC] Front image uploaded:', frontImageUrl);
      } else if (this.frontPreview) {
        frontImageUrl = this.frontPreview; // Keep existing if not changed/removed
      }

      let backImageUrl: string | undefined = '';
      // 2. Upload Back Image (if provided)
      if (this.selectedBackFile) {
        console.log('[KYC] Uploading back image...');
        const backRes = await firstValueFrom(this.kycService.uploadImage(this.selectedBackFile));
        if (!backRes?.success) throw new Error('Back image upload failed');
        backImageUrl = backRes.url;
        console.log('[KYC] Back image uploaded:', backImageUrl);
      } else if (this.backPreview) {
        backImageUrl = this.backPreview;
      }

      this.isUploading = false;
      this.isLoading = true;

      // 3. Submit KYC (ownership docs already saved to DB via separate upload)
      const submission: KYCSubmission = {
        documentType: this.kycForm.value.documentType,
        frontImage: frontImageUrl || '',
        backImage: backImageUrl || undefined,
      };

      this.kycService.submitKYC(submission).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: () => {
          this.notificationService.show('Documents submitted successfully!', 'success');
          
          // Clear local file selections so applyKYCData can load the permanent URLs from DB
          this.selectedFrontFile = null;
          this.selectedBackFile = null;
          
          // Fetch fresh data immediately to update UI
          this.loadConsolidatedData();
          this.startConsolidatedPolling(); // Ensure polling is active
        },
        error: (err: any) => {
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
