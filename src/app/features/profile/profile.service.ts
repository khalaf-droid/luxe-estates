import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/me`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/me/password`, data);
  }

  getBookings(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/bookings`);
  }

  getFavorites(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/favorites`);
  }

  getMyProperties(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/properties?owner=me`);
  }
}
