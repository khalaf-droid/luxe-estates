import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checkout-container">
      <div class="loader-box" *ngIf="isLoading">
        <div class="spinner"></div>
        <h2>Redirecting to Payment Gateway...</h2>
        <p>Please wait while we secure your transaction. Do not refresh the page.</p>
      </div>

      <div class="error-box" *ngIf="hasError">
        <h2>Checkout Failed</h2>
        <p>{{ errorMessage }}</p>
        <button class="action-btn primary" (click)="retry()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      text-align: center;
      color: #fff;
    }
    .loader-box {
      background: #111;
      border: 1px solid #c9a96e;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      border: 4px solid rgba(201, 169, 110, 0.3);
      border-top: 4px solid #c9a96e;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h2 {
      color: #c9a96e;
      margin-bottom: 0.5rem;
    }
    .error-box {
      background: #2a0808;
      border: 1px solid #ff4d4f;
      padding: 3rem;
      border-radius: 12px;
    }
    .error-box h2 {
      color: #ff4d4f;
    }
    .action-btn {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      background: #c9a96e;
      color: #000;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class CheckoutComponent implements OnInit {
  isLoading = true;
  hasError = false;
  errorMessage = '';
  bookingId: string | null = null;
  provider: 'paymob' | 'paypal' = 'paymob'; // Default to paymob

  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (this.bookingId) {
      this.startCheckout();
    } else {
      this.showError('Invalid booking reference.');
    }
  }

  startCheckout(): void {
    if (!this.bookingId) return;
    
    this.isLoading = true;
    this.hasError = false;
    
    // The frontend has NO LOGIC. It just calls the API and redirects.
    this.paymentService.checkout(this.bookingId, this.provider).subscribe({
      next: (res) => {
        if (res.data && res.data.checkoutUrl) {
          localStorage.setItem('lastCheckoutBookingId', this.bookingId!);
          window.location.href = res.data.checkoutUrl;
        } else {
          this.showError('Invalid response from payment gateway.');
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to initialize checkout session.';
        this.showError(msg);
      }
    });
  }

  retry(): void {
    this.startCheckout();
  }

  private showError(msg: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = msg;
  }
}
