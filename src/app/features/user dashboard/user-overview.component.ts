import { Component, OnInit } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { UserDashboardService, UserStats, UserProfile } from './user-dashboard.service';

interface StatsState {
  loading: boolean;
  error: boolean;
  data: UserStats | null;
}

@Component({
  selector: 'app-user-overview',
  templateUrl: './user-overview.component.html'
})
export class UserOverviewComponent implements OnInit {
  state$!: Observable<StatsState>;
  user: UserProfile | null = null;
  private retry$ = new Subject<void>();

  constructor(private userService: UserDashboardService) {}

  ngOnInit(): void {
    this.state$ = this.retry$.pipe(
      startWith(null),
      switchMap(() => this.userService.getStats().pipe(
        map(data => ({ loading: false, error: false, data })),
        catchError(() => of({ loading: false, error: true, data: null })),
        startWith({ loading: true, error: false, data: null })
      ))
    );
    this.userService.getProfile().subscribe({ next: (u) => (this.user = u), error: () => {} });
  }

  retry(): void {
    this.retry$.next();
  }
}
