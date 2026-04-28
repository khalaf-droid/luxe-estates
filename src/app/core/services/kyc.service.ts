import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, switchMap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface KYCStatusResponse {
  success: boolean;
  status: KYCStatus;
  reason?: string;
}

export interface KYCSubmission {
  documentType: 'national_id' | 'passport' | 'driver_license';
  frontImage: string;
  backImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /**
   * Upload an image to the backend and get back the Cloudinary URL
   */
  uploadImage(file: File): Observable<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    // Note: The prompt mentions POST /api/v1/properties/:id/images pattern.
    // For KYC, we'll assume a generic upload endpoint exists or use a placeholder.
    // Based on the prompt: "upload each image to the backend's image upload endpoint"
    return this.http.post<{ success: boolean; url: string }>(`${this.base}/upload`, formData);
  }

  /**
   * Submit the KYC documents
   */
  submitKYC(data: KYCSubmission): Observable<any> {
    return this.http.post(`${this.base}/kyc`, data);
  }

  /**
   * Get the current KYC status
   */
  getKYCStatus(): Observable<KYCStatusResponse> {
    return this.http.get<KYCStatusResponse>(`${this.base}/kyc/status`);
  }

  /**
   * Poll for KYC status every 30 seconds
   */
  pollStatus(): Observable<KYCStatusResponse> {
    return timer(0, 30000).pipe(
      switchMap(() => this.getKYCStatus()),
      shareReplay(1)
    );
  }
}
