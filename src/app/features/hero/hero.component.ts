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
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

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
  propertiesVal = 0;  // → 12,500
  satisfactionVal = 0; // → 89 %
  citiesVal = 0;       // → 45 +

  private subs = new Subscription();

  // Marquee items — duplicated in getter for seamless loop
  readonly marqueeItems = [
    'Luxury Penthouses',
    'Waterfront Villas',
    'Urban Apartments',
    'Commercial Spaces',
    'Investment Properties',
    'Holiday Retreats',
    'Historic Mansions',
  ];

  get allMarqueeItems() {
    return [...this.marqueeItems, ...this.marqueeItems];
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
    this.subs.unsubscribe();
  }

  // ── Counter animation ──────────────────────────────────────────────────────
  private startCounters(): void {
    this.animateCounter(0, 12500, 2000,
      (v) => this.ngZone.run(() => { this.propertiesVal = v;   this.cdr.detectChanges(); }));
    this.animateCounter(0, 89,    2000,
      (v) => this.ngZone.run(() => { this.satisfactionVal = v; this.cdr.detectChanges(); }));
    this.animateCounter(0, 45,    2000,
      (v) => this.ngZone.run(() => { this.citiesVal = v;       this.cdr.detectChanges(); }));
  }

  private animateCounter(
    from: number,
    to: number,
    duration: number,
    setter: (val: number) => void
  ): void {
    const steps = 60;
    const stepTime = duration / steps;
    const increment = (to - from) / steps;
    let current = from;

    const sub = interval(stepTime)
      .pipe(takeWhile(() => current < to))
      .subscribe(() => {
        current = Math.min(current + increment, to);
        setter(Math.floor(current));
      });

    this.subs.add(sub);
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

  formatCount(val: number): string {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return `${val}`;
  }
}
