import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  NotificationService,
  Notification,
} from '../services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: (Notification & { visible: boolean })[] = [];
  private subs = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subs.add(
      this.notificationService.notifications$.subscribe((n) => {
        this.notifications.push({ ...n, visible: true });
      })
    );

    this.subs.add(
      this.notificationService.dismiss$.subscribe((id) => {
        const item = this.notifications.find((n) => n.id === id);
        if (item) {
          item.visible = false;
          // Remove from array after animation
          setTimeout(() => {
            this.notifications = this.notifications.filter((n) => n.id !== id);
          }, 400);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }

  trackById(_: number, item: Notification): number {
    return item.id;
  }
}
