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

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  animations: [
    trigger('fadeInUp', [
      state('hidden', style({ opacity: 0, transform: 'translateY(40px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', animate('800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')),
    ]),
    trigger('fadeIn', [
      state('hidden', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('hidden => visible', animate('600ms ease')),
    ]),
  ],
})
export class HeroComponent implements OnInit, OnDestroy, AfterViewInit {
  // Animation states — staggered entrance
  eyebrowState = 'hidden';
  headlineState = 'hidden';
  subState = 'hidden';
  actionsState = 'hidden';
  searchState = 'hidden';
  statsState = 'hidden';

  // Animated counters
  countriesVal = 0;
  propertiesVal = 0;
  citiesVal = 0;

  private subs = new Subscription();

  tickerItems = [
    { label: 'DUBAI MARINA',       change: 12.4, positive: true  },
    { label: 'MANHATTAN PENTHOUSE', change: 8.2,  positive: true  },
    { label: 'LONDON MAYFAIR',     change: 2.1,  positive: false },
    { label: 'PALM JUMEIRAH',      change: 15.7, positive: true  },
    { label: 'PARIS 8ÈME',        change: 5.3,  positive: true  },
    { label: 'HONG KONG PEAK',     change: 1.8,  positive: false },
    { label: 'MONACO WATERFRONT',  change: 9.1,  positive: true  },
    { label: 'MILAN CENTRO',       change: 3.4,  positive: true  },
    { label: 'TOKYO ROPPONGI',     change: 0.7,  positive: false },
    { label: 'SYDNEY HARBOUR',     change: 6.9,  positive: true  },
  ];

  // Duplicated for seamless marquee loop
  get allTickerItems() {
    return [...this.tickerItems, ...this.tickerItems];
  }

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Staggered entrance — each element delayed per the design
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.ngZone.run(() => { this.eyebrowState = 'visible'; this.cdr.detectChanges(); }), 200);
      setTimeout(() => this.ngZone.run(() => { this.headlineState = 'visible'; this.cdr.detectChanges(); }), 400);
      setTimeout(() => this.ngZone.run(() => { this.subState = 'visible'; this.cdr.detectChanges(); }), 600);
      setTimeout(() => this.ngZone.run(() => { this.actionsState = 'visible'; this.cdr.detectChanges(); }), 800);
      setTimeout(() => this.ngZone.run(() => { this.searchState = 'visible'; this.cdr.detectChanges(); }), 950);
      setTimeout(() => this.ngZone.run(() => { this.statsState = 'visible'; this.cdr.detectChanges(); }), 1100);
      setTimeout(() => this.startCounters(), 1200);
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private startCounters(): void {
    this.animateCounter(0, 120, 2000, (v) => this.ngZone.run(() => { this.countriesVal = v; this.cdr.detectChanges(); }));
    this.animateCounter(0, 50,  2000, (v) => this.ngZone.run(() => { this.propertiesVal = v; this.cdr.detectChanges(); }));
    this.animateCounter(0, 45,  2000, (v) => this.ngZone.run(() => { this.citiesVal = v; this.cdr.detectChanges(); }));
  }

  private animateCounter(from: number, to: number, duration: number, setter: (val: number) => void): void {
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

  scrollToProperties(): void {
    const el = document.getElementById('properties');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/properties';
    }
  }
}
