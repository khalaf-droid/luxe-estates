import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notifications$ = this.notificationSubject.asObservable();

  private idCounter = 0;

  /**
   * Show a toast notification.
   * @param message - The message to display
   * @param type - 'success' | 'error' | 'info'
   * @param duration - Duration in ms before auto-dismiss (default 4000ms)
   */
  show(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 4000
  ): void {
    const id = ++this.idCounter;
    const notification: Notification = { message, type, id };
    this.notificationSubject.next(notification);

    // Auto-dismiss after duration — the consumer (component) handles removal
    // by subscribing and setting a timeout, but we emit a "dismiss" after duration
    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  private dismissSubject = new Subject<number>();
  dismiss$ = this.dismissSubject.asObservable();

  dismiss(id: number): void {
    this.dismissSubject.next(id);
  }
}
