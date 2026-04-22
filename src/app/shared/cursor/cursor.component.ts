import { Component, OnInit, OnDestroy, HostListener, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-cursor',
  templateUrl: './cursor.component.html',
  styleUrls: ['./cursor.component.scss'],
})
export class CursorComponent implements OnInit, OnDestroy {
  cursorX = 0;
  cursorY = 0;
  followerX = 0;
  followerY = 0;
  isHovering = false;

  private animationFrame: number | null = null;
  private targetX = 0;
  private targetY = 0;
  isMobile = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // Detect if device supports hover (not mobile)
    this.isMobile = !window.matchMedia('(hover: hover)').matches;

    if (!this.isMobile) {
      this.renderer.setStyle(document.body, 'cursor', 'none');
      this.animateFollower();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.renderer.removeStyle(document.body, 'cursor');
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isMobile) return;
    this.cursorX = event.clientX;
    this.cursorY = event.clientY;
    this.targetX = event.clientX;
    this.targetY = event.clientY;
  }

  @HostListener('document:mouseover', ['$event.target'])
  onMouseOverElement(target: EventTarget | null): void {
    if (!target) return;
    const el = target as HTMLElement;
    // Ensure element supports closest before calling it
    if (el.closest && el.closest('button, a, .card, [data-cursor-hover]')) {
      this.isHovering = true;
    }
  }

  @HostListener('document:mouseout', ['$event.target'])
  onMouseOutElement(target: EventTarget | null): void {
    if (!target) return;
    const el = target as HTMLElement;
    if (el.closest && el.closest('button, a, .card, [data-cursor-hover]')) {
      this.isHovering = false;
    }
  }

  // Smooth follower animation using lerp
  private animateFollower(): void {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      this.followerX = lerp(this.followerX, this.targetX, 0.12);
      this.followerY = lerp(this.followerY, this.targetY, 0.12);
      this.animationFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  get cursorStyle() {
    return {
      transform: `translate(${this.cursorX - 6}px, ${this.cursorY - 6}px)`,
    };
  }

  get followerStyle() {
    return {
      transform: `translate(${this.followerX - 20}px, ${this.followerY - 20}px)`,
    };
  }
}
