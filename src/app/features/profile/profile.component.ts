import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { takeUntil, map, catchError, shareReplay, tap } from 'rxjs/operators';

import { ProfileService } from './profile.service';
import { PropertiesService } from '../properties/services/properties.service';
import { FavoritesService } from '../properties/services/favorites.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private propertiesService = inject(PropertiesService);
  private favoritesService = inject(FavoritesService);
  private notificationService = inject(NotificationService);

  // ── Reactive State ────────────────────────────────────────────────────────
  user$: Observable<any> = this.profileService.getMe().pipe(
    map(res => res.data),
    tap(user => this.patchProfileForm(user)),
    shareReplay(1),
    catchError(() => {
      this.notificationService.show('Failed to load profile', 'error');
      return of(null);
    })
  );

  bookings$: Observable<any[]> = this.profileService.getBookings().pipe(catchError(() => of([])));
  favorites$: Observable<any[]> = this.favoritesService.getFavorites().pipe(catchError(() => of([])));
  myProperties$: Observable<any[]> = this.propertiesService.getMyProperties().pipe(catchError(() => of([])));

  // ── UI State ──────────────────────────────────────────────────────────────
  activeTab = 'overview';
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  isUpdatingProfile = false;
  isChangingPassword = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      bio: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  patchProfileForm(user: any): void {
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        phone: user.phone || '',
        bio: user.bio || ''
      });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) return;

    this.isUpdatingProfile = true;
    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.notificationService.show('Profile updated successfully', 'success');
        this.isUpdatingProfile = false;
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Failed to update profile', 'error');
        this.isUpdatingProfile = false;
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.profileService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.notificationService.show('Password changed successfully', 'success');
        this.passwordForm.reset();
        this.isChangingPassword = false;
      },
      error: (err) => {
        this.notificationService.show(err.error?.message || 'Failed to change password', 'error');
        this.isChangingPassword = false;
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'buyer': return 'badge-buyer';
      case 'owner': return 'badge-owner';
      case 'agent': return 'badge-agent';
      case 'admin': return 'badge-admin';
      default: return 'badge-default';
    }
  }
}
