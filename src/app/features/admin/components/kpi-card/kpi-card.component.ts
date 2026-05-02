import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [],
  template: `
    <article class="kpi-card">
      <div class="kpi-header">
        <span class="label">{{ label }}</span>
        <i [class]="iconClass"></i>
      </div>
      <div class="kpi-body">
        <strong>{{ value }}</strong>
        <span class="percentage" [class.positive]="isPositive">+{{ percentage }}%</span>
      </div>
    </article>
  `,
  styles: [`
    .kpi-card {
      background: var(--obsidian-3);
      border-radius: 12px;
      padding: 1.5rem;
      border-bottom: 3px solid var(--gold);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-header .label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(250, 250, 248, 0.7);
    }
    .kpi-header i {
      font-size: 1.5rem;
      color: rgba(201, 169, 110, 0.2);
    }
    .kpi-body {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .kpi-body strong {
      font-family: var(--font-display);
      font-size: 2rem;
      color: var(--white);
      font-weight: 500;
    }
    .percentage {
      font-family: var(--font-mono);
      font-size: 12px;
    }
    .percentage.positive {
      color: #10b981;
    }
  `]
})
export class KpiCardComponent {
  @Input() label!: string;
  @Input() value!: string | number | null;
  @Input() percentage!: number;
  @Input() isPositive: boolean = true;
  @Input() iconClass!: string;
}
