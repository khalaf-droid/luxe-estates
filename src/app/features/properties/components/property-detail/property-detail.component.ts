import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError, tap } from 'rxjs/operators';

import { PropertiesService } from '../../services/properties.service';
import { FavoritesService } from '../../services/favorites.service';
import { ReviewsService } from '../../services/reviews.service';
import { PropertyActionsService } from '../../services/property-actions.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-property-detail',
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.scss']
})
export class PropertyDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  private propertiesService = inject(PropertiesService);
  private favoritesService = inject(FavoritesService);
  private reviewsService = inject(ReviewsService);
  private propertyActionsService = inject(PropertyActionsService);
  
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  property$: Observable<Property | null> = of(null);
  reviews$: Observable<any[]> = of([]);
  isFavorited$: Observable<boolean> = of(false);
  
  isLoading = true;
  error: string | null = null;
  
  activeImageIndex = 0;
  
  viewingForm!: FormGroup;
  inquiryForm!: FormGroup;
  isSubmittingViewing = false;
  isSubmittingInquiry = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.buildForms();

    this.property$ = this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('id')),
      tap(() => {
        this.isLoading = true;
        this.error = null;
      }),
      switchMap(id => {
        if (!id) return of(null);
        return this.propertiesService.getPropertyById(id).pipe(
          catchError(err => {
            this.error = 'Failed to load property details. Please try again later.';
            this.isLoading = false;
            return of(null);
          })
        );
      }),
      tap(property => {
        if (property) {
          this.isLoading = false;
          this.loadAdditionalData(property._id);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.viewingForm = this.fb.group({
      date: ['', Validators.required]
    });

    this.inquiryForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private loadAdditionalData(id: string): void {
    this.reviews$ = this.reviewsService.getReviewsByPropertyId(id).pipe(
      catchError(() => of([]))
    );
    this.isFavorited$ = this.favoritesService.isFavorited$(id);
  }

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
  }

  onToggleFavorite(propertyId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to save favorites', 'info');
      return;
    }

    this.favoritesService.toggleFavorite(propertyId).subscribe({
      next: (isFav) => {
        this.notificationService.show(
          isFav ? 'Added to favorites' : 'Removed from favorites',
          isFav ? 'success' : 'info'
        );
      },
      error: () => {
        this.notificationService.show('Failed to update favorite', 'error');
      }
    });
  }

  onScheduleViewing(propertyId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to schedule a viewing', 'info');
      return;
    }

    if (this.viewingForm.invalid || this.isSubmittingViewing) return;

    this.isSubmittingViewing = true;
    const date = this.viewingForm.get('date')?.value;

    this.propertyActionsService.scheduleViewing(propertyId, date).subscribe({
      next: (success) => {
        this.isSubmittingViewing = false;
        if (success) {
          this.notificationService.show('Viewing scheduled successfully!', 'success');
          this.viewingForm.reset();
        } else {
          this.notificationService.show('Failed to schedule viewing', 'error');
        }
      },
      error: (err) => {
        this.isSubmittingViewing = false;
        this.notificationService.show(err.error?.message || 'An error occurred. Please try again.', 'error');
      }
    });
  }

  onSendInquiry(propertyId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.authService.openModal('login');
      this.notificationService.show('Sign in to send an inquiry', 'info');
      return;
    }

    if (this.inquiryForm.invalid || this.isSubmittingInquiry) return;

    this.isSubmittingInquiry = true;
    const message = this.inquiryForm.get('message')?.value;

    this.propertyActionsService.makeInquiry(propertyId, message).subscribe({
      next: (success) => {
        this.isSubmittingInquiry = false;
        if (success) {
          this.notificationService.show('Inquiry sent successfully!', 'success');
          this.inquiryForm.reset();
        } else {
          this.notificationService.show('Failed to send inquiry', 'error');
        }
      },
      error: (err) => {
        this.isSubmittingInquiry = false;
        this.notificationService.show(err.error?.message || 'An error occurred. Please try again.', 'error');
      }
    });
  }

  formatPrice(price: number, currency: string, status: 'for-sale' | 'for-rent'): string {
    return this.propertiesService.formatPrice(price, currency, status);
  }
}
