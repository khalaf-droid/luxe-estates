import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="transactions-panel">
      <div class="panel-header">
        <h3>Recent Transactions</h3>
        <a routerLink="/admin/bookings" class="view-all">VIEW ALL</a>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>USER</th>
              <th>PROPERTY</th>
              <th>DATE</th>
              <th>STATUS</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let txn of transactions">
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ getInitials(txn.user_id?.name) }}</div>
                  <span>{{ txn.user_id?.name || 'Unknown User' }}</span>
                </div>
              </td>
              <td class="property-name">{{ txn.booking_id?.property_id?.title || 'Property #' + txn.booking_id?.property_id?.toString().slice(-4) }}</td>
              <td>{{ txn.createdAt | date:'mediumDate' }}</td>
              <td>
                <span class="status-badge" [class.confirmed]="txn.status === 'paid'" [class.pending]="txn.status !== 'paid'">
                  {{ txn.status === 'paid' ? 'CONFIRMED' : 'PENDING' }}
                </span>
              </td>
              <td class="amount">{{ txn.amount | currency:'USD':'symbol':'1.0-0' }}</td>
            </tr>
            <tr *ngIf="!transactions?.length">
              <td colspan="5" class="empty-state">No recent transactions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .transactions-panel {
      background: var(--obsidian-3);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .panel-header h3 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      margin: 0;
      color: var(--white);
    }
    .view-all {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--gold);
      text-decoration: none;
      letter-spacing: 2px;
      transition: color 0.3s ease;
    }
    .view-all:hover {
      color: var(--white);
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      font-family: var(--font-mono);
      font-size: 10px;
      color: rgba(250, 250, 248, 0.4);
      letter-spacing: 2px;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    td {
      padding: 1.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-family: var(--font-body);
      font-size: 14px;
      color: var(--mist);
      vertical-align: middle;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--white);
    }
    .avatar {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--white);
    }
    .property-name {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
    }
    .status-badge.confirmed {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    .status-badge.pending {
      background: rgba(201, 169, 110, 0.1);
      color: var(--gold);
    }
    .amount {
      font-weight: 600;
      color: var(--gold);
    }
    .empty-state {
      text-align: center;
      color: rgba(250, 250, 248, 0.4);
      padding: 3rem 0;
    }
  `]
})
export class TransactionsTableComponent {
  @Input() transactions: any[] = [];

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
