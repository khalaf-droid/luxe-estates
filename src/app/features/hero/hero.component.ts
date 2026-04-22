import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ─── Shared easing curve (mirrors var(--transition) from _variables.scss) ───
const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

// ─── Factory: reusable fadeInUp trigger with baked-in delay ─────────────────
// Each element gets its own named trigger so delays are declarative
// and the template stays clean (coding-rules §5.1 / Task-02 spec).
function fadeInUp(triggerName: string, delayMs: number) {
  return trigger(triggerName, [
    state('hidden', style({ opacity: 0, transform: 'translateY(40px)' })),
    state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
    transition(
      'hidden => visible',
      animate(`800ms ${delayMs}ms ${EASE}`)
    ),
  ]);
}

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  animations: [
    // Staggered delays baked into each trigger (Task-02 spec):
    // eyebrow 0.2s → headline-line1 0.4s → headline-line2 0.6s
    // → subText 0.8s → buttons 1.0s → stats 1.2s
    fadeInUp('eyebrow',   200),
    fadeInUp('headline1', 400),
    fadeInUp('headline2', 600),
    fadeInUp('subText',   800),
    fadeInUp('buttons',  1000),
    fadeInUp('stats',    1200),
  ],
})
export class HeroComponent implements OnInit, OnDestroy, AfterViewInit {

  // Single state bound to all triggers — delays are in the triggers, not here
  animState: 'hidden' | 'visible' = 'hidden';

  // Animated counters
  countriesVal = 0;   // → 120
  propertiesVal = 0;  // → 50
  citiesVal = 0;      // → 45

  private destroy$ = new Subject<void>();

  // ── Market Ticker — Task 05 ────────────────────────────────────────────────
  tickerItems = [
    { label: 'DUBAI MARINA',        change: 12.4, positive: true  },
    { label: 'MANHATTAN PENTHOUSE', change: 8.2,  positive: true  },
    { label: 'LONDON MAYFAIR',      change: 2.1,  positive: false },
    { label: 'PALM JUMEIRAH',       change: 15.7, positive: true  },
    { label: 'PARIS 8ÈME',          change: 5.3,  positive: true  },
    { label: 'HONG KONG PEAK',      change: 1.8,  positive: false },
    { label: 'MONACO WATERFRONT',   change: 9.1,  positive: true  },
    { label: 'MILAN CENTRO',        change: 3.4,  positive: true  },
    { label: 'TOKYO ROPPONGI',      change: 0.7,  positive: false },
    { label: 'SYDNEY HARBOUR',      change: 6.9,  positive: true  },
  ];

  get allTickerItems() {
    return [...this.tickerItems, ...this.tickerItems];
  }

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Fire all triggers together — each trigger's baked-in delay
    // handles the visual stagger without setTimeout chaining.
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() =>
        this.ngZone.run(() => {
          this.animState = 'visible';
          this.cdr.detectChanges();
          this.startCounters();
        }),
      50); // minimal initial delay for Angular to complete first paint
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Counter animation ──────────────────────────────────────────────────────
  private startCounters(): void {
    // 2000ms duration
    this.animateCounter(0, 120, 2000,
      (v) => this.ngZone.run(() => { this.countriesVal = Math.floor(v); this.cdr.detectChanges(); }));
    this.animateCounter(0, 50, 2000,
      (v) => this.ngZone.run(() => { this.propertiesVal = Math.floor(v); this.cdr.detectChanges(); }));
    this.animateCounter(0, 45, 2000,
      (v) => this.ngZone.run(() => { this.citiesVal = Math.floor(v); this.cdr.detectChanges(); }));
  }

  private animateCounter(
    from: number,
    to: number,
    duration: number,
    setter: (val: number) => void
  ): void {
    const stepTime = 16; // ~60fps
    const steps = duration / stepTime;
    const increment = (to - from) / steps;
    let current = from;

    interval(stepTime)
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (current >= to) {
          setter(to);
          // Only the component's destroy$ cleans up the global subscription automatically
          return;
        }
        current = Math.min(current + increment, to);
        setter(current);
      });
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────
  scrollToProperties(): void {
    const el = document.getElementById('properties');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/properties';
    }
  }


}
