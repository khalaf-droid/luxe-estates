import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  checkout(bookingId: string, provider: 'paymob' | 'paypal' = 'paymob'): Observable<{ status: string; data: { checkoutUrl: string } }> {
    return this.http.post<{ status: string; data: { checkoutUrl: string } }>(`${this.apiUrl}/checkout`, {
      bookingId,
      provider
    });
  }

  // Not strictly needed if frontend logic is dumb, but good to have
  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${paymentId}`);
  }
}
