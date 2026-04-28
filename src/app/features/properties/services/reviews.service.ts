import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getReviewsByPropertyId(id: string): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.base}/reviews/property/${id}`)
      .pipe(map((res) => res.data));
  }
}
