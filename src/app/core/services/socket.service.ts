import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly baseUrl = environment.apiUrl.replace('/api/v1', '');

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(this.baseUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
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
    return fromEvent(this.socket!, 'newBid').pipe(
      filter((data: any) => data.auctionId === auctionId)
    );
  }

  onAuctionClosed(auctionId: string): Observable<any> {
    return fromEvent(this.socket!, 'auctionClosed').pipe(
      filter((data: any) => data.auctionId === auctionId)
    );
  }

  onNotification(): Observable<any> {
    return fromEvent(this.socket!, 'notification');
  }
}
