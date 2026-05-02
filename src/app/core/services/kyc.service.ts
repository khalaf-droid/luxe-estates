import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, switchMap, shareReplay, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface KYCStatusResponse {
  success: boolean;
  status: KYCStatus;
  reason?: string;
}

export interface BackendKYCResponse {
  status: string;
  data: {
    kycStatus: KYCStatus;
    rejectionReason?: string;
    submitted?: boolean;
    approved?: boolean;
  }
}

export interface KYCSubmission {
  documentType: 'national_id' | 'passport' | 'drivers_license';
  frontImage: string;
  backImage?: string;
  ownershipDocuments?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class KycService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  uploadImage(file: File): Observable<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ status: string; data: { url: string } }>(`${this.base}/kyc/upload`, formData).pipe(
      map(res => ({
        success: res.status === 'success',
        url: res.data.url
      }))
    );
  }

  /**
   * Submit the KYC documents
   */
  submitKYC(data: KYCSubmission): Observable<any> {
    return this.http.post(`${this.base}/kyc`, data);
  }

  getKYCStatus(): Observable<KYCStatusResponse> {
    return this.http.get<BackendKYCResponse>(`${this.base}/kyc/status`).pipe(
      map(res => ({
        success: res.status === 'success',
        status: res.data.kycStatus,
        reason: res.data.rejectionReason
      }))
    );
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
