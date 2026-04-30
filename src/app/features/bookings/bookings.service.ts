import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BookingRequest {
  propertyId: string;
  start_date: string;
  end_date: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bookings`;

  createBooking(req: BookingRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, req, { withCredentials: true });
  }

  getMyBookings(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { withCredentials: true });
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/cancel`, {}, { withCredentials: true });
  }
}
