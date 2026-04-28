import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyActionsService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  scheduleViewing(propertyId: string, date: string): Observable<boolean> {
    return this.http
      .post<void>(`${this.base}/viewing-requests`, { propertyId, date })
      .pipe(map(() => true));
  }

  makeInquiry(propertyId: string, message: string): Observable<boolean> {
    return this.http
      .post<void>(`${this.base}/inquiries`, { propertyId, message })
      .pipe(map(() => true));
  }
}
