# Luxe Estates — Project Analysis

## Overview

**Luxe Estates** is a luxury real-estate web platform built with **Angular 17** (class-based NgModule architecture). It is currently a **scaffolded skeleton** — the global shell, design system, and routing are fully wired, but all four feature pages still show placeholder components.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (NgModule, not standalone) |
| Language | TypeScript ~5.2 |
| Styling | SCSS (no CSS frameworks) |
| HTTP | Angular HttpClient + custom interceptor |
| Forms | Reactive Forms (imported in Properties) |
| Animation | BrowserAnimationsModule + custom keyframes |
| Fonts | Google Fonts (Cormorant Garamond, DM Sans, Space Mono) |
| State | None yet (RxJS Subjects only) |
| Auth | JWT via `luxe_token` in localStorage |
| Testing | Karma + Jasmine |
| Deployment | `angular-cli-ghpages` (GitHub Pages) |

---

## Architecture

```
src/
├── index.html                  # lang="ar" dir="rtl" — Arabic/RTL project
├── styles.scss                 # Global resets + utility classes
├── styles/
│   ├── _variables.scss         # Design tokens (CSS vars + SCSS vars + mixins)
│   └── _animations.scss        # Shared keyframe library
└── app/
    ├── app.module.ts           # Root module
    ├── app-routing.module.ts   # Lazy-loaded routes
    ├── app.component.ts        # Shell: cursor + nav + router-outlet + notification
    ├── core/
    │   ├── auth/               # Empty (gitkeep)
    │   ├── interceptors/       # AuthInterceptor (Bearer token from localStorage)
    │   ├── nav/                # NavComponent (scroll-aware header)
    │   └── store/              # Empty (gitkeep)
    ├── features/
    │   ├── hero/               # HeroModule (placeholder component)
    │   ├── properties/         # PropertiesModule (placeholder)
    │   ├── auctions/           # AuctionsModule (placeholder)
    │   └── agents/             # AgentsModule (placeholder)
    └── shared/
        ├── cursor/             # Custom cursor with lerp-smoothed follower
        ├── notification/       # Toast notification system
        └── services/           # NotificationService (RxJS Subject-based)
```

### Routing

| Path | Module | Status |
|---|---|---|
| `/` | HeroModule | 🔴 Placeholder |
| `/properties` | PropertiesModule | 🔴 Placeholder |
| `/auctions` | AuctionsModule | 🔴 Placeholder |
| `/agents` | AgentsModule | 🔴 Placeholder |
| `/**` | → `/` (redirect) | ✅ |

All routes use **lazy loading** via `loadChildren`. `scrollPositionRestoration: 'top'` and `anchorScrolling: 'enabled'` are configured.

---

## Design System

A well-thought-out token system lives in `_variables.scss`:

**Color Palette**

| Token | Value | Role |
|---|---|---|
| `--gold` | `#C9A96E` | Primary accent |
| `--gold-light` | `#E8D5B0` | Hover/highlight |
| `--gold-dark` | `#A8844A` | Pressed states |
| `--obsidian` | `#0A0A0F` | Page background |
| `--obsidian-2/3/4` | layered darks | Card/panel backgrounds |
| `--mist` | `#8A8AA0` | Secondary text |
| `--white` | `#FAFAF8` | Body text |
| `--crimson` | `#C0392B` | Error/danger |
| `--emerald` | `#27AE60` | Success |

**Typography**
- Display headings → `Cormorant Garamond` (serif, luxury feel)
- Body text → `DM Sans` (clean, readable)
- Monospace / labels → `Space Mono`

**Utility Mixins**
- `@mixin container` — max-width 1400px, responsive padding
- `@mixin eyebrow` — mono uppercase label style
- `@mixin gold-border-bottom` — subtle gold divider
- `@mixin glass-bg` — `backdrop-filter: blur(20px)` glassmorphism

**Animation Library** (`_animations.scss`)  
fadeIn, fadeInUp, fadeInDown, slideInRight, slideInLeft, scaleIn, goldShimmer, tickerScroll, pulse, spin, modalSlideUp, overlayFadeIn — all with utility classes and stagger delay helpers (`.delay-1` → `.delay-5`).

---

## Implemented Components

### NavComponent (`core/nav`)
- Transparent → frosted-glass on scroll (`isScrolled` via `window.scrollY > 50`)
- Logo: `LUXE·ESTATES`
- Links: Properties, Auctions, Explore, Agents
- Actions: Sign In button, List Property button

### CursorComponent (`shared/cursor`)
- Custom dot cursor + lagging follower (lerp factor 0.12)
- Disabled on mobile/touch (`hover: none` media query)
- Enlarges on hover over `button, a, .card, [data-cursor-hover]`
- Hides native cursor via `Renderer2`

### NotificationComponent (`shared/notification`)
- Global toast system driven by `NotificationService`
- Supports `success | error | info` types
- Auto-dismiss with configurable duration (default 4000ms)
- Animated enter/exit (`visible` flag + `setTimeout`)
- Memory-safe: `Subscription` properly unsubscribed on destroy

### AuthInterceptor (`core/interceptors`)
- Reads `luxe_token` from `localStorage`
- Attaches `Authorization: Bearer <token>` header on every HTTP request

---

## Current State

> **The project is a well-structured, team-ready scaffold — the foundation is solid, but all content pages are still empty.**

Each feature module has a placeholder component showing a colored screen with the Arabic text indicating which team member is responsible:

- **Hero** → assigned to `اريني` (pink/gold)
- **Properties** → assigned to `خلف` (green)
- **Auctions** → assigned to `مينا` (red)
- **Agents** → assigned to `مينا` (red)

The placeholders explicitly list what needs to be added (e.g., `PropertiesComponent`, `PropertyCardComponent`, `CountdownPipe`, etc.).

---

## Key Observations

> [!TIP]
> The design system is production-quality — tokens, mixins, and animations are all ready to use. New components should consume `_variables.scss` mixins, not write one-off CSS.

> [!IMPORTANT]
> `index.html` declares `lang="ar" dir="rtl"` — this is an **RTL project**. All layout must be RTL-aware (use `margin-inline-start` over `margin-left`, etc.).

> [!NOTE]
> The `core/auth/` and `core/store/` directories are empty (only `.gitkeep`). A proper auth service and state management solution (e.g., NgRx or a simple service-based store) are planned but not yet implemented.

> [!WARNING]
> `NotificationComponent` references `dismiss$` from `NotificationService`, but the service exposes it as `dismiss$` only after the private `dismissSubject` declaration (line 42). Make sure team members use `notificationService.dismiss$` not `notificationService.notifications$` for dismissal.

---

## Immediate Next Steps (What's Missing)

| Priority | Item |
|---|---|
| 🔴 High | Implement `HeroComponent` (homepage landing) |
| 🔴 High | Implement `PropertiesComponent` + `PropertyCardComponent` |
| 🔴 High | Implement `AuctionsComponent` + `CountdownPipe` |
| 🔴 High | Implement `AgentsComponent` + `AgentCardComponent` |
| 🟡 Medium | Build `AuthService` in `core/auth/` (login/logout/token management) |
| 🟡 Medium | Add a state management layer in `core/store/` |
| 🟡 Medium | Add mobile hamburger menu to `NavComponent` |
| 🟢 Low | Add SEO meta tags (`og:`, `twitter:`, descriptions) |
| 🟢 Low | Add route guards (auth guard for protected routes) |
| 🟢 Low | Add loading/skeleton states for lazy-loaded modules |
