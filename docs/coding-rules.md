# LUXE ESTATES — Coding Rules & Design System
> Derived from the official `Template/index.html`. Every team member **must** follow these rules without exception.

---

## 1. Design Language — The Core Identity

The app has a **dark luxury aesthetic**: deep obsidian backgrounds, gold accents, and elegant typography. Every decision should reinforce this identity.

### 1.1 Color Tokens
Always use CSS variables. **Never hardcode colors** directly.

| Variable | Value | Usage |
|---|---|---|
| `--gold` | `#C9A96E` | Primary accent: borders, labels, price, active states |
| `--gold-light` | `#E8D5B0` | Hover highlights |
| `--gold-dark` | `#8B6914` | Scrollbar thumb, pressed/deep accent |
| `--obsidian` | `#0A0A0F` | Main page background |
| `--obsidian-2` | `#111118` | Section alternate backgrounds |
| `--obsidian-3` | `#1A1A24` | Card/panel backgrounds |
| `--obsidian-4` | `#22222E` | Input fields, timer blocks, deeply nested elements |
| `--slate` | `#2E2E3E` | Borders, dividers |
| `--mist` | `#8A8AA0` | Secondary/placeholder text, labels |
| `--pearl` | `#F4F1EB` | Reserved for high-contrast callouts |
| `--white` | `#FAFAF8` | Primary body text |
| `--crimson` | `#C0392B` | Error states, Auction badges, danger |
| `--emerald` | `#27AE60` | Success states, "For Rent" badges |
| `--sapphire` | `#2980B9` | Info states, "For Rent" property tag |

### 1.2 Typography — Three Fonts, Three Roles

```scss
--font-display: 'Cormorant Garamond', serif;   // All headings (h1–h6), prices, names, section titles
--font-body:    'DM Sans', sans-serif;          // Body text, nav links, descriptions, paragraphs
--font-mono:    'Space Mono', monospace;         // Labels, eyebrows, badges, buttons, tags, timers
```

**Rules:**
- `font-display` → headings, hero titles, property names, prices, agent names, testimonials
- `font-body` → paragraph text, descriptions, form inputs, nav links
- `font-mono` → ALL uppercase labels (eyebrows), ALL buttons, ALL badge text, ALL form labels, ALL stat labels, countdown text
- `<em>` inside headings → italic + `color: var(--gold)` — this is the signature heading style

### 1.3 Easing Functions
```css
--transition:        cubic-bezier(0.25, 0.46, 0.45, 0.94);   /* Standard smooth */
--transition-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Buttons, cards, modals */
```
Use `--transition-bounce` for elements that should feel alive (buttons, cards hover, modals).  
Use `--transition` for everything else (color changes, opacity, nav scroll state).

---

## 2. Layout Rules

### 2.1 Spacing Baseline
- Section padding: `120px 60px` (desktop) → `80px 30px` (≤1024px)
- No section should deviate from this rhythm
- Container max-width: `1400px` centered

### 2.2 Grid Patterns from Template

| Section | Grid | Notes |
|---|---|---|
| Properties | `repeat(3, 1fr)`, `gap: 2px` | First card spans `grid-column: span 2` at 16:9 |
| Features | `repeat(4, 1fr)`, `gap: 1px` | Separated by gold `rgba` background |
| Agents | `repeat(4, 1fr)`, `gap: 2px` | |
| Testimonials | `repeat(3, 1fr)`, `gap: 2px` | |
| Cities | `2fr 1fr 1fr`, first card `row: span 2` | |
| Metrics Strip | `repeat(5, 1fr)` | `gap: 1px` with gold-tint background |
| Auctions | `1fr 1fr`, `gap: 80px` | Left: text+list, Right: card |
| Footer | `2fr 1fr 1fr 1fr`, `gap: 60px` | |
| Newsletter | `1fr 1fr`, `gap: 80px` | |
| Search | `1fr 1fr 1fr 1fr auto` | Last col is the submit button |

> **Rule:** Gaps between cards are `2px` (or `1px` for features/specs). This creates the "panel grid" luxury aesthetic. Never use large gaps between cards.

---

## 3. Component Patterns

### 3.1 Section Eyebrow
Every section starts with this pattern:
```html
<div class="section-eyebrow">Curated Selection</div>
<h2 class="section-title">Featured <em>Properties</em></h2>
```
**CSS:**
- `font-family: var(--font-mono)`, `font-size: 10px`, `letter-spacing: 4px`, `text-transform: uppercase`, `color: var(--gold)`
- Has a `::before` pseudo-element: `width: 30px; height: 1px; background: var(--gold)`
- The `<em>` in the title is always italic + gold

### 3.2 Buttons

**btn-primary** (Gold filled):
```css
padding: 16px 40px;
background: var(--gold);
color: var(--obsidian);
font-family: var(--font-mono); /* ALWAYS mono for buttons */
font-size: 12px;
font-weight: 600; /* or 700 */
letter-spacing: 2px;
text-transform: uppercase;
border: none;
```
- Hover: `translateY(-2px)` + `box-shadow: 0 20px 60px rgba(201,169,110,0.3)`
- Has a `::before` shine sweep on hover (translateX -100% → 100% with skewX)

**btn-secondary** (Ghost/outline):
```css
padding: 16px 40px;
background: transparent;
color: var(--white);
border: 1px solid rgba(255,255,255,0.2);
/* same font rules */
```
- Hover: `border-color: var(--gold); color: var(--gold)`

**nav-cta** (Nav CTA button):
```css
padding: 10px 28px;
border: 1px solid var(--gold);
color: var(--gold);
font-size: 11px;
letter-spacing: 2px;
```
- Hover: `background: var(--gold); color: var(--obsidian)`

### 3.3 Property Cards
```
aspect-ratio: 3/4  (standard cards)
aspect-ratio: 16/9 (first/featured card — spans 2 columns)
```
- Image: `transition: transform 0.8s var(--transition)`, `filter: brightness(0.7)`
- Hover image: `scale(1.08)`, `filter: brightness(0.5)`
- Overlay: `linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.3) 50%, transparent 100%)`
- Tags: `.property-tag` positioned `top: 24px; left: 24px` — gold for Sale, sapphire for Rent, crimson for Auction
- Favorite button: `top: 24px; right: 24px` — circular, blur backdrop

### 3.4 Badges
Three standard badge variants:
```html
<span class="badge badge-gold">PENTHOUSE</span>
<span class="badge badge-emerald">FOR RENT</span>
<span class="badge badge-crimson">AUCTION</span>
```
- All use `font-mono`, `font-size: 9px`, `letter-spacing: 2px`, `text-transform: uppercase`, `border-radius: 2px`

### 3.5 Form Inputs
```css
/* Labels */
font-family: var(--font-mono);
font-size: 9px;
letter-spacing: 3px;
text-transform: uppercase;
color: var(--gold);      /* label always gold */

/* Inputs — two styles */

/* Style A — underline only (search, newsletter) */
background: transparent;
border: none;
border-bottom: 1px solid rgba(255,255,255,0.15);
color: var(--white);
padding: 10px 0;

/* Style B — full border (modal forms) */
background: transparent;
border: 1px solid rgba(255,255,255,0.1);
padding: 14px 16px;
```
- Focus state: `border-color: var(--gold)` in both cases
- Placeholder: `color: var(--mist)`
- `outline: none` always

### 3.6 Live Badge (Auction)
```html
<div class="live-badge">
  <div class="live-dot"></div>
  <span>3 Active Auctions</span>
</div>
```
- Pulsing crimson dot with `animation: pulse 1.5s infinite`
- Background: `rgba(192,57,43,0.2)`, border: `1px solid var(--crimson)`

### 3.7 Modals
- Overlay: `backdrop-filter: blur(12px)` + `background: rgba(0,0,0,0.8)`
- Modal container: `background: var(--obsidian-3)`, `border: 1px solid rgba(201,169,110,0.2)`
- Entry animation: `translateY(30px) scale(0.95)` → `translateY(0) scale(1)` using `--transition-bounce`
- ESC key always closes
- `body { overflow: hidden }` when open

### 3.8 Navigation
- Height: `80px`, padding: `0 60px`
- Transparent by default → `.scrolled`: `rgba(10,10,15,0.95)` + `backdrop-filter: blur(20px)` + bottom gold border
- Scroll threshold: `window.scrollY > 50`
- Links: `font-size: 12px`, weight 500, `letter-spacing: 2px`, uppercase, color `--mist`
- Link hover: `color: --gold` + underline scaleX from 0→1 (left origin)
- Logo: `font-display`, 22px, `letter-spacing: 4px`

### 3.9 Notification Toasts
- Position: `fixed; top: 100px; right: 24px`
- Entry: `translateX(120%)` → `translateX(0)` with `--transition-bounce`
- Left border color indicates type: gold (info), crimson (error), emerald (success)
- Auto dismiss: 4000ms

---

## 4. Scroll Animation System

Every section must participate in scroll-reveal:
```html
<div class="reveal">...</div>
<div class="reveal reveal-delay-1">...</div>  <!-- 0.1s delay -->
<div class="reveal reveal-delay-2">...</div>  <!-- 0.2s delay -->
<div class="reveal reveal-delay-3">...</div>  <!-- 0.3s delay -->
<div class="reveal reveal-delay-4">...</div>  <!-- 0.4s delay -->
```
Base state: `opacity: 0; transform: translateY(40px)`  
Triggered state (`.visible`): `opacity: 1; transform: translateY(0)`  
Transition: `0.8s var(--transition)` on both properties  
Triggered by `IntersectionObserver` at `threshold: 0.1`, `rootMargin: '0px 0px -50px 0px'`

> In Angular, implement this via a `ScrollRevealDirective` that applies the same `IntersectionObserver` logic.

---

## 5. Angular-Specific Implementation Rules

### 5.1 CSS/SCSS
- All global tokens live in `src/styles/_variables.scss` — use only those
- Component SCSS files import `@use '../../../../styles/variables' as *;`
- **Never** write one-off hardcoded values; always reference a CSS variable or SCSS token
- The `_animations.scss` provides all keyframes — do not redefine them in components
- Use `@mixin container`, `@mixin eyebrow`, `@mixin gold-border-bottom`, `@mixin glass-bg` from `_variables.scss`

### 5.2 Module Rules
- All feature routes use `RouterModule.forChild(routes)` — **never** `forRoot` inside feature modules
- Lazy-load all four feature modules (already configured in `app-routing.module.ts`)
- Declare components only in their own module
- Import `CommonModule`, `ReactiveFormsModule`, and `HttpClientModule` per-feature as needed

### 5.3 Price Formatting
Always use this exact logic (match mock data format):
```typescript
formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000)     return `$${(price / 1_000).toFixed(0)}K`;
  return `$${price.toLocaleString()}`;
}
```

### 5.4 API Integration
- Base URL: `http://localhost:5000/api`
- All requests go through Angular's `HttpClient` with the `AuthInterceptor` that attaches `Bearer` token
- Token key in localStorage: `luxe_token`
- User key in localStorage: `luxe_user`
- **Always provide mock data fallbacks** — components must render with mock data when the API is offline
- Endpoint patterns:
  - `GET /properties?limit=6&listingType=sale&type=villa&city=...`
  - `GET /properties/:id`
  - `POST /auth/login` → `{ email, password }`
  - `POST /auth/register` → `{ name, email, password, role }`
  - `POST /bids` → `{ auctionId, amount }`
  - `POST /favorites/:id`
  - `POST /viewings` → `{ propertyId, date }`
  - `POST /inquiries` → `{ propertyId, message }`

### 5.5 Notification Usage
Inject `NotificationService` and use:
```typescript
this.notificationService.show('Message here', 'success'); // or 'error' | 'info'
```
Never show raw `alert()` or `console.error()` in production code.

### 5.6 Custom Cursor
- Already implemented globally in `CursorComponent`
- Add `[data-cursor-hover]` attribute to any custom element that should enlarge the follower
- Do **not** re-implement cursor logic inside feature components

### 5.7 RTL Awareness
`index.html` declares `lang="ar" dir="rtl"`. Use logical CSS properties:
- `margin-inline-start` instead of `margin-left`
- `padding-inline-end` instead of `padding-right`
- `inset-inline-start` instead of `left`

---

## 6. Data Models (from mock data)

### Property
```typescript
interface Property {
  _id: string;
  title: string;
  city: string;
  type: 'apartment' | 'villa' | 'penthouse' | 'office' | 'land';
  listingType: 'sale' | 'rent' | 'auction';
  price: number;
  area: number;        // m²
  bedrooms: number;
  bathrooms: number;
  images: string[];    // URLs
  description: string;
  features: string[];  // e.g. ['Pool', 'Gym', 'Concierge']
}
```

### Auction
```typescript
interface Auction {
  _id: string;
  title: string;
  city: string;
  startingBid: number;
  currentBid: number;
  endsAt: Date;
  image: string;
  bidders: number;
}
```

### Agent
```typescript
interface Agent {
  name: string;
  specialty: string;
  sales: number;
  value: string;       // e.g. '$340M'
  rating: string;      // e.g. '4.9'
  initial: string;     // Avatar letter
  countries: string[];
}
```

---

## 7. Page Sections (Hero Module)

The hero page must include these sections **in order**:
1. **Page Loader** — full-screen with animated gold loading bar (~2.2s)
2. **Navigation** — fixed, scroll-aware
3. **Hero Section** — 100vh, gradient bg + gold grid + floating orbs + animated stats
4. **Search Bar** — overlapping hero bottom (`margin-top: -60px`)
5. **Metrics Strip** — 5-column animated counters
6. **Marquee** — infinitely scrolling property categories (pauses on hover)
7. **Properties Section** — tabbed filter + 3-col card grid
8. **Gold Divider**
9. **Features Section** — 4-col grid
10. **Auctions Section** — 2-col: list + featured card with live countdown
11. **Cities Section** — asymmetric grid (5 cities)
12. **Testimonials** — 3-col
13. **Agents Section** — 4-col cards
14. **CTA Banner** — centered, radial gold gradient
15. **Newsletter** — 2-col
16. **Footer** — 4-col top + copyright bottom

---

## 8. Noise Texture Overlay
The template uses a full-page subtle noise texture to add depth:
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,...fractalNoise...");
  opacity: 0.018;
  pointer-events: none;
  z-index: 9999;
}
```
This is already in `styles.scss` — do not remove it.

---

## 9. Z-Index Layer Order (Do Not Deviate)

| Layer | z-index | Used by |
|---|---|---|
| Base content | `1` | Normal elements |
| Navigation | `1000` | `app-nav` |
| Notifications | `9000` | `app-notification` |
| Auth Modal | `9000` | Auth overlay |
| Property Modal | `9001` | Prop overlay |
| Noise texture | `9999` | `body::before` |
| Page Loader | `99999` | Loader screen |
| Custom Cursor | `99999` | `app-cursor` |

---

## 10. What NOT To Do

- ❌ Never use `margin-left` / `margin-right` — use logical properties
- ❌ Never hardcode a hex color — always use `var(--token)` or `$scss-var`
- ❌ Never use system fonts — always one of the three Google Fonts
- ❌ Never add `font-family` to a button without using `var(--font-mono)`
- ❌ Never use `forRoot()` in a lazy-loaded feature module
- ❌ Never call `alert()` — use `NotificationService`
- ❌ Never skip the eyebrow label above a section title
- ❌ Never remove `.reveal` from a new section — everything must scroll-animate
- ❌ Never write inline `style="color:#C9A96E"` — use CSS classes
- ❌ Never use a card gap larger than `2px` between property/agent/testimonial cards
