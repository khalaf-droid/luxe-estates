import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpClient
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class TokenRefreshInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !request.url.includes('auth/refresh-token') &&
          !request.url.includes('auth/login')
        ) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.http.post<any>(`${environment.apiUrl}/auth/refresh-token`, {}, { withCredentials: true }).pipe(
        switchMap((res: any) => {
          this.isRefreshing = false;
          const token = res.token;
          
          if (token) {
            localStorage.setItem('luxe_token', token);
            // We use the same key as AuthService
            this.refreshTokenSubject.next(token);
            
            // Retry the original request with the new token
            return next.handle(this.addToken(request, token));
          }

          // If no token in response, logout
          return this.logoutAndRedirect();
        }),
        catchError((err) => {
          this.isRefreshing = false;
          return this.logoutAndRedirect();
        })
      );
    } else {
      // Queue the request while refreshing
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addToken(request, token!)))
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private logoutAndRedirect(): Observable<never> {
    this.authService.logout();
    this.router.navigate(['/']);
    return throwError(() => new Error('Session expired'));
  }
}
