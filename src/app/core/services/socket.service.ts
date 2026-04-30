import { Injectable } from '@angular/core';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────────────────────────────────────────
// SocketService — thin wrapper around socket.io-client
// Uses dynamic import() so it tree-shakes correctly in Angular builds
// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SocketService {
  // Use 'any' to avoid fighting socket.io-client's type exports across versions
  private socket: any = null;
  private readonly baseUrl = environment.apiUrl.replace('/api/v1', '');

  connect(token: string): void {
    if (this.socket?.connected) return;

    // Dynamic import avoids CommonJS/AMD optimization bailout warning
    import('socket.io-client').then(({ io }) => {
      this.socket = io(this.baseUrl, {
        auth:            { token },
        withCredentials: true,
        transports:      ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('[Socket] connected');
      });

      this.socket.on('connect_error', (error: Error) => {
        console.warn('[Socket] connection error:', error?.message ?? error);
      });
    }).catch(() => {
      console.warn('[Socket] socket.io-client not available');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAuction(auctionId: string): void {
    this.socket?.emit('joinAuction', auctionId);
  }

  leaveAuction(auctionId: string): void {
    this.socket?.emit('leaveAuction', auctionId);
  }

  onNewBid(auctionId: string): Observable<any> {
    if (!this.socket) return EMPTY;
    return fromEvent(this.socket, 'newBid').pipe(
      filter((data: any) => data?.auctionId === auctionId)
    );
  }

  onAuctionClosed(auctionId: string): Observable<any> {
    if (!this.socket) return EMPTY;
    return fromEvent(this.socket, 'auctionClosed').pipe(
      filter((data: any) => data?.auctionId === auctionId)
    );
  }

  onNotification(): Observable<any> {
    if (!this.socket) return EMPTY;
    return fromEvent(this.socket, 'notification');
  }
}
