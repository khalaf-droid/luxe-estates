import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// ── Backend: POST /viewing-requests ──────────────────────────────────────────
// Validator (validators.js) requires:
//   propertyId:    string (MongoId)
//   preferredDate: ISO date string (min: 'now')
//   preferredTime: string HH:MM format   ← REQUIRED
//   message?:      string (max 500)
export interface ViewingRequestPayload {
  propertyId: string;
  preferredDate: string;   // ISO 8601 date string e.g. '2025-06-15'
  preferredTime: string;   // HH:MM e.g. '10:00'
  message?: string;
}

// ── Backend: POST /inquiries ──────────────────────────────────────────────────
// Validator (inquiry.validators.js) requires:
//   propertyId: string (MongoId)   ← camelCase confirmed in validator
//   message:    string (min 5, max 1000)
export interface InquiryPayload {
  propertyId: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyActionsService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /**
   * Schedule a property viewing.
   * Backend requires: propertyId, preferredDate (ISO), preferredTime (HH:MM)
   */
  scheduleViewing(payload: ViewingRequestPayload): Observable<boolean> {
    return this.http
      .post<void>(`${this.base}/viewing-requests`, payload)
      .pipe(map(() => true));
  }

  /**
   * Send an inquiry about a property.
   * Backend requires: propertyId, message (min 5 chars)
   */
  makeInquiry(propertyId: string, message: string): Observable<boolean> {
    const payload: InquiryPayload = { propertyId, message };
    return this.http
      .post<void>(`${this.base}/inquiries`, payload)
      .pipe(map(() => true));
  }
}
