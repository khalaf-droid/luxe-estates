# Luxe Estates — Full Stack Analysis & Production Task Plan

**Senior Full-Stack Review · Angular 17 (MEAN Stack) · Date: April 2026**

---

## Part 1 — Frontend Architecture Analysis

### What's Built & Working

| Layer | Status | Notes |
|---|---|---|
| Angular 17 Shell | ✅ Solid | AppModule, lazy routing, AnimationsModule all wired |
| Design System | ✅ Excellent | Gold/Obsidian tokens, Cormorant Garamond typography, full animation library |
| AuthService | ✅ Mostly done | Login, Register, OTP, ForgotPassword, ResetPassword, Logout — HTTP calls written |
| AuthInterceptor | ✅ Correct | Bearer token + `withCredentials: true` on all requests |
| AuthGuard | ✅ Correct | Functional guard pattern, opens modal on redirect |
| PropertiesService | ✅ Mostly done | Full CRUD, filter state (BehaviorSubject), mock fallback, price formatter |
| AuctionsComponent | ✅ Mostly done | Bid logic, countdown, scroll reveal, mock fallback |
| AgentsComponent | ✅ Solid | Social actions, scroll reveal, mock fallback |
| NavComponent | ✅ Done | Scroll-aware header |
| NotificationService | ✅ Done | Toast system (RxJS Subject) |
| Custom Cursor | ✅ Done | LERP-smoothed follower |
| BecomeAgentComponent | ⚠️ Scaffolded | Form built, file upload ready — but HTTP call is mocked with setTimeout |
| SearchBarComponent | ⚠️ Disconnected | Form exists but emits nothing — explore button has no navigation logic |
| Footer / Newsletter | ⚠️ Scaffolded | No API call for newsletter subscription |

### What's Completely Missing from Frontend

| Missing Feature | Impact |
|---|---|
| Socket.IO client integration | Auctions show no real-time bids |
| OTP verification page/component | Users who register can't verify email in-app |
| Token refresh flow (401 interceptor) | Sessions expire silently, user gets stuck |
| User Profile / Dashboard page | No route, no component |
| Bookings page | No route, no component |
| Favorites page | No route, no component |
| Property detail page (full page) | Only a modal exists — no `/properties/:id` route |
| Add/Edit Property page | `/add-property` route referenced in BecomeAgentComponent but doesn't exist |
| KYC submission page | Backend requires KYC approval before booking/payment |
| Payment flow / checkout page | Full payment system on backend has zero frontend |
| Reviews section on property detail | Backend model + endpoints exist, no UI |
| Notifications center | Backend sends real-time notifications, no UI |
| Saved searches UI | Backend has full saved-search logic, no UI |
| Pagination on all list pages | Properties, Auctions have no paginator |
| Admin dashboard | Full backend stats API exists, no frontend |
| Search bar → navigation | `onExplore()` emits but properties page ignores it |
| Global 401/403 error handling | No redirect on token expiry |
| Agents endpoint on backend | Component falls back to mock 100% of the time |

---

## Part 2 — Backend API Compatibility Audit

### Critical URL Mismatches

These will cause **silent failures** (caught by catchError → mock data), making the app appear to work while never hitting the real backend.

| Frontend Call | What Frontend Sends | What Backend Expects | Verdict |
|---|---|---|---|
| Auth base URL | `http://localhost:3000/api/v1/auth` (hardcoded in auth.service.ts) | `/api/v1/auth` on port **3000** (default) | ⚠️ Port correct but should use `environment.apiUrl`, not hardcoded |
| Properties | `environment.apiUrl + /properties` → `http://localhost:5000/api/properties` | `/api/v1/properties` | ❌ Wrong port (5000 vs 3000) + missing `/v1/` |
| Auctions | `environment.apiUrl + /auctions` | `/api/v1/auctions` | ❌ Same — wrong port + missing `/v1/` |
| Bids | `environment.apiUrl + /bids` | `/api/v1/bids` | ❌ Same |
| Favorites toggle | `POST /api/favorites/:propertyId` | `POST /api/v1/favorites` (body: `{ propertyId }`) | ❌ Wrong path structure + method signature |
| Viewings | `POST /api/viewings` | `POST /api/v1/viewing-requests` | ❌ Wrong path name |
| Inquiries | `POST /api/inquiries` | `POST /api/v1/inquiries` | ❌ Missing `/v1/` |
| Agents | `environment.apiUrl + /agents` | **DOES NOT EXIST** in backend | ❌ No agents endpoint — always falls back to mock |

### Response Shape Compatibility

| Endpoint | Backend Shape | Frontend Expects | Verdict |
|---|---|---|---|
| POST /login | `{ status:'success', token, data:{ user } }` | `res.status === 'success' && res.token && res.data?.user` | ✅ Match |
| GET /properties | `{ success: true, data: [...] }` | `res.data` | ✅ Match |
| POST /register | `{ status:'success', message }` | Handles, shows OTP step | ✅ Match |
| POST /favorites | `{ success, data:{ favorited } }` | `res.data.favorited` → `boolean` | ✅ Match |
| GET /auctions | Array of `Auction[]` | `Auction[]` directly | ⚠️ Backend wraps in `{ success, data }` — frontend doesn't unwrap |

### Port Conflict

`environment.ts` sets `apiUrl: 'http://localhost:5000/api'` but the backend defaults to port **3000**. The `auth.service.ts` hardcodes port 3000 correctly, but every other service uses the environment file with port 5000. **Pick one and enforce it everywhere.**

### Role System Mismatch

| System | Roles |
|---|---|
| Backend User model | `buyer \| owner \| agent \| admin` |
| Frontend BecomeAgentComponent | Writes `"Seller"` to localStorage — **not a valid backend role** |
| Frontend AuthService User interface | `role: string` — no enum enforcement |

### Backend Features With Zero Frontend Coverage

The backend has a rich feature set that the frontend doesn't touch at all:

- **KYC system** — bookings and payments are gated behind `requireKYC` middleware; without a frontend KYC flow, users can never book.
- **Payment system** — Paymob + PayPal + Bank Transfer + Cash; no checkout page exists.
- **Refresh token rotation** — backend issues `httpOnly` refresh cookie on login; frontend never calls `/api/v1/auth/refresh-token` on 401.
- **Real-time Socket.IO** — backend emits `newBid`, `auctionClosed`, `notification` events; frontend has no Socket.IO client.
- **Saved searches** — full CRUD + notification job; no UI.
- **Reviews** — model, endpoints, virtual populate on Property; no UI.
- **Notifications** — notification model + real-time push; no notification bell/center.
- **Admin dashboard** — stats endpoints, user management, KYC approval; no admin panel.
- **Property image upload** — Cloudinary multipart upload endpoint; no frontend file upload on property creation.
- **Booking management** — approve/reject/cancel flow; no UI.

---

## Part 3 — Task Plan (Priority-Ordered)

---

### 🔴 PHASE 1 — Foundation Fixes (Do These First — Everything Breaks Without Them)

---

#### Task 1.1 — Fix API Base URL & Environment Config

**Problem:** Two conflicting base URLs across the codebase; nothing hits the right backend endpoint.

**Steps:**
1. Set `environment.ts` → `apiUrl: 'http://localhost:3000/api/v1'`
2. Set `environment.prod.ts` → `apiUrl: 'https://your-railway-domain.railway.app/api/v1'`
3. Remove the hardcoded URL from `auth.service.ts` — replace with `inject(environment).apiUrl` or import directly
4. Update all service URL strings: `/properties`, `/auctions`, `/bids`, `/inquiries`, `/favorites`, `/viewing-requests`
5. Fix favorites call: change `POST /favorites/${id}` → `POST /favorites` with `{ propertyId: id }` in body
6. Fix viewings path: `/viewings` → `/viewing-requests`

**Prompt for AI Coding Assistant:**
```
You are working on an Angular 17 MEAN stack frontend called "Luxe Estates".
The backend REST API base is at /api/v1 on port 3000 in development.

Fix the environment configuration:
- src/environments/environment.ts: set apiUrl to 'http://localhost:3000/api/v1'
- src/environments/environment.prod.ts: set apiUrl to 'https://PROD_DOMAIN/api/v1'

Then audit every service file under src/app/ and:
1. Remove any hardcoded URLs — all services must use `environment.apiUrl`
2. Fix path in PropertiesService: /properties (correct, already relative to apiUrl)
3. Fix toggleFavorite: change POST to `${base}/favorites` with body `{ propertyId }` 
   instead of `${base}/favorites/${propertyId}` — backend expects propertyId in body
4. Fix scheduleViewing: change path from /viewings to /viewing-requests
5. Fix AuctionsComponent direct HTTP calls: /auctions and /bids are correct relative paths
6. Fix AgentsComponent: /agents does NOT exist on backend — keep mock data fallback 
   but change the HTTP call to /users?role=agent as a placeholder

Show the full updated file for each changed file.
```

---

#### Task 1.2 — Fix Role Enum + User Interface

**Problem:** `BecomeAgentComponent` writes `role: "Seller"` to localStorage — backend will reject this. Backend roles are `buyer | owner | agent | admin`.

**Steps:**
1. Add role enum to `auth.service.ts`: `export type UserRole = 'buyer' | 'owner' | 'agent' | 'admin'`
2. Update `User` interface: `role: UserRole`
3. Fix `BecomeAgentComponent.onSubmit()` to use `role: 'agent'` (not `'Seller'`)
4. The real role upgrade must call the backend — see Task 3.3

**Prompt:**
```
In the Luxe Estates Angular 17 project, fix the role type system:

1. In src/app/core/auth/auth.service.ts:
   - Add: export type UserRole = 'buyer' | 'owner' | 'agent' | 'admin';
   - Update User interface: role: UserRole

2. In src/app/features/become-agent/become-agent.component.ts:
   - In onSubmit(), change parsedUser.role = 'Seller' to parsedUser.role = 'agent'
   - Add a comment: // TODO: Task 3.3 — wire real HTTP call to PATCH /api/v1/users/upgrade-role

3. In src/app/core/store/user.state.ts:
   - Import UserRole and expose a getter: get userRole(): UserRole | null

Show the complete updated files.
```

---

#### Task 1.3 — Implement Token Refresh Interceptor (401 Handler)

**Problem:** Backend issues 15-minute access tokens. When they expire, every API call returns 401. Without a refresh flow, users get silently logged out.

**Steps:**
1. Create `token-refresh.interceptor.ts` — on 401, call `POST /api/v1/auth/refresh-token` (backend sends refresh token via httpOnly cookie automatically)
2. On success → update stored token → retry original request
3. On failure → call `authService.logout()` → redirect to `/`
4. Register in `AppModule` providers after `AuthInterceptor`

**Prompt:**
```
Create a new Angular 17 HTTP interceptor at:
src/app/core/interceptors/token-refresh.interceptor.ts

Requirements:
- Implements HttpInterceptor
- Catches 401 HttpErrorResponse
- Calls POST http://localhost:3000/api/v1/auth/refresh-token 
  (no body needed — backend reads httpOnly cookie automatically)
  with withCredentials: true
- On success: extract new token from response.token, save to localStorage as 'luxe_token',
  update AuthService._isAuthenticated$ to true, then retry the original request with the new token
- On failure (refresh also returns 401): call authService.logout() then router.navigate(['/'])
- Use a BehaviorSubject isRefreshing flag to queue concurrent requests during the refresh
  (standard Angular refresh token queue pattern)
- Must NOT intercept the /refresh-token endpoint itself (prevent infinite loop)

Also update src/app/app.module.ts to register this interceptor AFTER AuthInterceptor in providers[].
Show complete files.
```

---

### 🟠 PHASE 2 — Core User Flows (Makes the App Actually Usable)

---

#### Task 2.1 — OTP Verification Component

**Problem:** After registration, the backend sends an OTP email. There is no frontend page to enter it.

**Steps:**
1. Create `src/app/core/auth/otp-verify/otp-verify.component.ts` (standalone)
2. Show 6-digit OTP input (FormControl with pattern validator)
3. On submit → call `authService.verifyAccount(email, otp)`
4. On success → show notification → route to `/` and open login modal
5. Add "Resend OTP" button → call `POST /api/v1/auth/resend-otp`
6. Add route in `app-routing.module.ts`: `{ path: 'verify-otp', loadComponent: ... }`
7. Update `auth-modal` register flow to redirect to `/verify-otp?email=xxx` after successful registration

**Prompt:**
```
Create a standalone Angular 17 OTP verification component for Luxe Estates:

Path: src/app/core/auth/otp-verify/otp-verify.component.ts (+ .html + .scss)

Design requirements (match existing design system):
- Dark background (--obsidian), gold accents (--gold: #C9A96E), DM Sans font
- 6-input OTP boxes (auto-focus next on keystroke, backspace goes back)
- Email shown at top ("We sent a code to {email}")
- "Verify Account" button (gold style, loading spinner)
- "Resend Code" link with 60-second cooldown timer

Logic:
- Read email from ActivatedRoute queryParams: this.route.snapshot.queryParams['email']
- On submit: call authService.verifyAccount(email, otp).subscribe(...)
  - Success: notificationService.show('Account verified!', 'success') then router.navigate(['/'])
    then authService.openModal('login')
  - Error: notificationService.show(err.error?.message || 'Invalid OTP', 'error')
- Resend button: call POST /api/v1/auth/resend-otp with { email } via HttpClient

Also add route to app-routing.module.ts:
{ path: 'verify-otp', loadComponent: () => import('./core/auth/otp-verify/...').then(m => m.OtpVerifyComponent) }

And update auth-modal register success handler to:
router.navigate(['/verify-otp'], { queryParams: { email: registeredEmail } });
```

---

#### Task 2.2 — Search Bar → Properties Navigation

**Problem:** `onExplore()` in SearchBarComponent emits a void event. The HeroComponent catches it but does nothing with the search form values.

**Steps:**
1. Change `SearchBarComponent` to emit `SearchPayload` instead of void: `{ location, type, listingType, budget }`
2. `HeroComponent.onExplore()` → `router.navigate(['/properties'], { queryParams })`
3. `PropertiesPageComponent` → on `ngOnInit`, read `ActivatedRoute.queryParams` and call `propertiesService.setFilter()` accordingly
4. Map budget strings to `minPrice`/`maxPrice` filter params

**Prompt:**
```
Wire the search bar to the properties page in Luxe Estates Angular 17.

Step 1 — SearchBarComponent (src/app/features/hero/search-bar/):
- Change @Output() explore to emit a typed payload:
  export interface SearchPayload { location: string; type: string; listingType: string; minPrice?: number; maxPrice?: number; }
- Add budgetToRange() helper to convert 'Up to $500K' → { maxPrice: 500000 }, etc.
- onExplore() emits this.explore.emit({ ...this.searchForm.value, ...this.budgetToRange() })

Step 2 — HeroComponent (src/app/features/hero/):
- Inject Router
- onExplore(payload: SearchPayload): navigate to /properties with queryParams stripped of null/undefined values

Step 3 — PropertiesPageComponent (src/app/features/properties/components/properties-page/):
- Inject ActivatedRoute
- In ngOnInit, subscribe to queryParams
- Map queryParams to PropertyFilters and call propertiesService.getProperties(filters)
- Display results reactively using async pipe

Show all three updated files in full.
```

---

#### Task 2.3 — User Profile & Dashboard Page

**Problem:** No profile page exists. Backend has `GET /api/v1/users/me` with full role-based dashboard data.

**Steps:**
1. Create `src/app/features/profile/` module (lazy-loaded)
2. Component shows: avatar, name, email, role badge, `isVerified` badge
3. Editable fields: name, phone, bio (PATCH `/api/v1/users/me`)
4. Change password section (PATCH `/api/v1/users/me/password`)
5. Role-based tabs: Buyer → bookings + favorites; Owner/Agent → my properties + inquiries
6. Add route: `{ path: 'profile', canActivate: [authGuard], loadChildren: ... }`
7. Nav profile avatar → links to `/profile`

**Prompt:**
```
Create a Profile/Dashboard page for Luxe Estates Angular 17.

Generate the full feature module at src/app/features/profile/:
- profile.module.ts (lazy-loaded NgModule)
- profile.component.ts + .html + .scss
- profile.service.ts — wraps API calls

ProfileService methods:
  getMe(): Observable<any> — GET /api/v1/users/me (returns user + role dashboard data)
  updateProfile(data): Observable<any> — PATCH /api/v1/users/me
  changePassword(currentPwd, newPwd): Observable<any> — PATCH /api/v1/users/me/password

ProfileComponent:
- Load getMe() on init, show skeleton loader while loading
- Editable card: name, phone, bio — save button calls updateProfile()
- Change password card with currentPassword + newPassword + confirm fields
- Show role badge (buyer=blue, owner=gold, agent=green, admin=red)
- Show verification status badge
- Tabs: 
  * "My Bookings" (fetch GET /api/v1/bookings) — shows status badge and property title
  * "Favorites" (fetch GET /api/v1/favorites) — shows property card grid  
  * For owner/agent: "My Properties" (fetch GET /api/v1/properties?owner=me)

Design: match existing dark theme (--obsidian, --gold), DM Sans, gold section dividers.
Register route in app-routing.module.ts with canActivate: [authGuard].
Show all generated files.
```

---

#### Task 2.4 — Property Detail Page

**Problem:** Only a modal exists. No `/properties/:id` route for shareable links, SEO, full details.

**Steps:**
1. Create `PropertyDetailComponent` inside the properties module
2. Add route: `{ path: 'properties/:id', ... }`
3. Load property via `propertiesService.getPropertyById(id)`
4. Show image gallery, full description, features, location, bedrooms/bathrooms/area stats
5. Schedule Viewing button → date picker → `propertiesService.scheduleViewing()`
6. Inquiry form → `propertiesService.makeInquiry()`
7. Favorite toggle button
8. Reviews section (GET `/api/v1/reviews/property/:id`)

**Prompt:**
```
Create a full Property Detail page for Luxe Estates Angular 17.

Add to PropertiesModule at src/app/features/properties/components/property-detail/:
- property-detail.component.ts + .html + .scss

Route: add { path: ':id', component: PropertyDetailComponent } inside properties.module.ts routing.

The component must:
1. Read route param: this.route.snapshot.params['id']
2. Call propertiesService.getPropertyById(id) — show skeleton loader
3. Image gallery: main image + thumbnails strip, click thumbnail → show as main
4. Stats row: bedrooms | bathrooms | area (m²) icons
5. Features list as gold-outlined chips
6. Two action cards:
   a) Schedule Viewing: date input (min = today) + submit → propertiesService.scheduleViewing()
      - If not authenticated: authService.openModal('login')
      - On success: notificationService.show('Viewing scheduled!', 'success')
   b) Send Inquiry: textarea + submit → propertiesService.makeInquiry()
      - Same auth guard pattern
7. Favorite heart button (top-right on hero image):
   - Shows filled/outline based on propertiesService.isFavorited(id)
   - On click: propertiesService.toggleFavorite(id)
8. Reviews section:
   - Fetch GET /api/v1/reviews/property/:id via HttpClient
   - Show star rating + comment + reviewer name + date
   - Empty state: "Be the first to review after your visit"

Design: dark luxury style matching existing property-modal.component.scss.
Update property-card.component.html to add [routerLink]="['/properties', property._id]" on the card title.
```

---

### 🟡 PHASE 3 — Advanced Features

---

#### Task 3.1 — Socket.IO Real-Time Bidding

**Problem:** Backend emits `newBid` and `auctionClosed` via Socket.IO. Frontend has no socket client — bids are stale.

**Steps:**
1. Install `socket.io-client`: `npm install socket.io-client`
2. Create `src/app/core/services/socket.service.ts`
3. Connect with JWT token in handshake auth: `{ auth: { token } }`
4. `joinAuction(id)` / `leaveAuction(id)` methods
5. `onNewBid$(auctionId)` → Observable that emits on `newBid` event
6. `onAuctionClosed$(auctionId)` → Observable
7. Wire into `AuctionsComponent` — subscribe after loading auctions; update `currentBid` reactively

**Prompt:**
```
Add Socket.IO real-time support to Luxe Estates Angular 17.

Step 1 — Install: npm install socket.io-client @types/socket.io-client

Step 2 — Create src/app/core/services/socket.service.ts:
- @Injectable({ providedIn: 'root' })
- Private Socket instance (from 'socket.io-client' import { io, Socket })
- connect(): void — called after login
  URL: environment.apiUrl.replace('/api/v1', '')  (strip the path to get base URL)
  Options: { auth: { token: this.authService.getToken() }, withCredentials: true }
- disconnect(): void
- joinAuction(auctionId: string): void — emits 'joinAuction' event
- leaveAuction(auctionId: string): void
- onNewBid(auctionId: string): Observable<{ currentBid: number; bid: any; timestamp: string }>
  Uses fromEvent(this.socket, 'newBid').pipe(filter(data => data.auctionId === auctionId))
- onAuctionClosed(auctionId: string): Observable<{ winner: any; finalBid: number }>
- onNotification(): Observable<{ type: string; title: string; message: string; link: string }>
  Listens to 'notification' event

Step 3 — Update AuctionsComponent:
- Inject SocketService
- After processAuctions(), call socketService.connect() if authenticated
- For each auction, call socketService.joinAuction(a._id)
- Subscribe to socketService.onNewBid(a._id) and update auction.currentBid in the array
- Subscribe to socketService.onAuctionClosed(a._id) and show notification
- In ngOnDestroy, leaveAuction for all and socketService.disconnect()

Step 4 — Update AuthService.logout() to call socketService.disconnect()

Show all files.
```

---

#### Task 3.2 — KYC Submission Flow

**Problem:** Backend's `requireKYC` middleware blocks bookings and payments. Users need to submit ID documents via Cloudinary to get KYC approved. Without this, no user can ever book a property.

**Steps:**
1. Create `src/app/features/kyc/kyc.component.ts` (standalone)
2. Form: document type selector + front image upload + back image upload
3. On submit → `POST /api/v1/kyc` with `{ documentType, frontImageUrl, backImageUrl }`
4. Note: images go to Cloudinary first (backend handles upload via its own endpoint), or use the backend's upload middleware
5. Show KYC status banner in profile page (pending/approved/rejected)
6. Add route: `/kyc`

**Prompt:**
```
Create a KYC (Know Your Customer) submission page for Luxe Estates Angular 17.

Create standalone component: src/app/features/kyc/kyc.component.ts + .html + .scss

The backend endpoint is POST /api/v1/kyc with body:
{ documentType: 'national_id' | 'passport' | 'driver_license', frontImageUrl: string, backImageUrl: string }

Images are uploaded via multipart to POST /api/v1/properties/:id/images (reuse this pattern).
For KYC specifically, upload each image to the backend's image upload endpoint, 
receive the Cloudinary URL back, then include the URLs in the KYC submission.

Component logic:
1. Document type radio: National ID | Passport | Driver's License
2. Front image file input with preview thumbnail
3. Back image file input with preview thumbnail (hidden for Passport type)
4. Upload images button → POST FormData to your backend image endpoint (adapt URL)
5. Submit KYC button → POST /api/v1/kyc with the Cloudinary URLs received
6. Show status widget: poll GET /api/v1/kyc/status every 30 seconds
   - not_submitted: show the form
   - pending: show "Under Review" badge (orange)
   - approved: show "Verified" badge (green) + "You can now book properties"
   - rejected: show reason + allow resubmission

Add to app-routing.module.ts with canActivate: [authGuard]:
{ path: 'kyc', loadComponent: () => import(...).then(m => m.KycComponent) }

Add a "Complete Verification" banner in profile.component when kycStatus !== 'approved'.
Design must match the dark luxury theme (--obsidian background, --gold accents).
```

---

#### Task 3.3 — Become Agent — Wire Real API

**Problem:** `BecomeAgentComponent` mocks submission with `setTimeout`. The backend has no role-upgrade endpoint — the closest is `PATCH /api/v1/auth/update-role` which is admin-only.

**Steps:**
1. Backend needs a `POST /api/v1/users/upgrade-request` endpoint (or use the existing become-agent concept)
2. On frontend: remove `setTimeout` mock, call `PATCH /api/v1/auth/update-role` OR submit via inquiry to admin
3. Redirect to `/profile` (not `/add-property` which doesn't exist) after success
4. **Recommended:** After backend adds the endpoint, replace mock with real HTTP call using FormData

**Prompt:**
```
Fix BecomeAgentComponent in Luxe Estates to make a real HTTP call.

Current code uses setTimeout to mock submission. Replace with:

1. Inject HttpClient and AuthService
2. In onSubmit(), after form validation, build FormData as already coded
3. Send: this.http.post<any>(`${environment.apiUrl}/users/upgrade-request`, formData)
   (This endpoint needs to be created on the backend — see backend task)
4. On success:
   - notificationService.show('Application submitted! We will review within 48 hours.', 'success')  
   - Update local user role optimistically only if backend confirms: update localStorage
   - router.navigate(['/profile'])  (NOT /add-property which doesn't exist)
5. On error:
   - notificationService.show(err.error?.message || 'Submission failed', 'error')
   - Set isLoading = false

Also fix the invalid role string: role should be 'agent' not 'Seller'.

Note: Add a backend route POST /api/v1/users/upgrade-request that:
  - Requires protect middleware
  - Accepts FormData: companyName, phone, iban, bio, idCard (file), logo (file)
  - Validates KYC is approved first
  - Creates an admin notification for review
  - Does NOT immediately change the role (admin must approve via PATCH /auth/update-role)
  - Returns { message: 'Application received' }

Show the complete updated become-agent.component.ts.
```

---

#### Task 3.4 — Notifications Bell & Center

**Problem:** Backend sends `notification` events via Socket.IO and stores them in the Notification model. No UI exists.

**Steps:**
1. Add notification bell icon to NavComponent with unread count badge
2. Dropdown panel showing last 10 notifications (GET `/api/v1/notifications`)
3. Click notification → navigate to `notification.link`
4. Mark as read: PATCH `/api/v1/notifications/:id/read`
5. Real-time: subscribe to `socketService.onNotification()` to increment badge live

**Prompt:**
```
Add a Notifications Center to the NavComponent in Luxe Estates Angular 17.

Step 1 — Create NotificationsService at src/app/core/services/notifications.service.ts:
- getNotifications(): Observable<any[]> — GET /api/v1/notifications
- markAsRead(id: string): Observable<any> — PATCH /api/v1/notifications/:id/read
- unreadCount$ BehaviorSubject<number> — updated from getNotifications() and socket events

Step 2 — Update NavComponent (src/app/core/nav/nav.component.ts + .html + .scss):
- Inject NotificationsService and SocketService
- Show bell icon (SVG) only when user is authenticated (use authService.isAuthenticated$)
- Unread count badge (red circle) on bell icon, sourced from notificationsService.unreadCount$
- Click bell → toggle dropdown panel (max-height 400px, scrollable)
- Dropdown shows each notification:
  * Icon based on type (booking=🏠, payment=💳, auction=🔨, system=🔔)
  * Title (bold) + message (muted) + time ago
  * Unread notifications have a gold left border
  * Click notification → router.navigate() to notification.link + markAsRead()
- Empty state: "No new notifications"
- On init (when authenticated): subscribe to socketService.onNotification() 
  to prepend new notifications and increment unreadCount$

Design: dropdown must be glassmorphism (backdrop-filter blur), dark bg, gold accents.
Show all updated/created files.
```

---

### 🟢 PHASE 4 — Production Readiness

---

#### Task 4.1 — Pagination on Properties & Auctions Pages

**Prompt:**
```
Add pagination to both Properties and Auctions pages in Luxe Estates Angular 17.

Create a shared Paginator component: src/app/shared/paginator/paginator.component.ts (standalone)
- Inputs: @Input() currentPage: number; @Input() totalPages: number; @Input() totalItems: number
- Output: @Output() pageChange = new EventEmitter<number>()
- Shows: Previous | 1 2 3 ... 12 | Next (with ellipsis for large page counts)
- Style: dark theme, gold active page highlight

Update PropertiesService:
- getProperties() to accept a page parameter
- Return type: Observable<{ data: Property[]; total: number; pages: number; currentPage: number }>
- Backend sends: { success, data, totalItems, totalPages, currentPage } — map accordingly

Update PropertiesPageComponent:
- Add currentPage = 1, totalPages = 1 state
- On page change from paginator: call propertiesService.getProperties(filters, page)
- Scroll to top after page change

Apply same pattern to AuctionsComponent with GET /api/v1/auctions?page=X&limit=6
```

---

#### Task 4.2 — Global Error Handler & Loading States

**Prompt:**
```
Add production-grade error handling and loading states to Luxe Estates Angular 17.

1. Create GlobalErrorHandler at src/app/core/error/global-error.handler.ts:
   - Implements ErrorHandler
   - Logs to console in dev, sends to logging service in prod
   - On ChunkLoadError (lazy route load fail): window.location.reload()
   - Register in AppModule providers: { provide: ErrorHandler, useClass: GlobalErrorHandler }

2. Create LoadingService at src/app/core/services/loading.service.ts:
   - isLoading$ BehaviorSubject<boolean>
   - show() / hide() methods

3. Create LoadingInterceptor at src/app/core/interceptors/loading.interceptor.ts:
   - On request start: loadingService.show()
   - On response/error: loadingService.hide()
   - Skip loading bar for polling requests (e.g., /kyc/status)

4. Add a top loading bar to AppComponent (thin gold line at top of viewport):
   - Uses LoadingService.isLoading$
   - CSS: position fixed, top 0, height 3px, background gold gradient, z-index 99999
   - Animates width from 0 to 80% on show, jumps to 100% then fades on hide

5. Add empty states to all list pages:
   - Properties: "No properties found matching your filters" + reset button
   - Auctions: "No active auctions at this time"
   - Profile/Bookings: "No bookings yet — explore properties"
```

---

#### Task 4.3 — Property Creation Page (for Agents/Owners)

**Prompt:**
```
Create an "Add Property" page for authenticated owners and agents in Luxe Estates Angular 17.

Path: src/app/features/add-property/
- add-property.module.ts (lazy-loaded)
- add-property.component.ts + .html + .scss

Route: { path: 'add-property', canActivate: [authGuard, roleGuard(['owner','agent','admin'])], loadChildren: ... }

Create roleGuard at src/app/core/auth/role.guard.ts:
- Takes allowed roles array
- Checks authService.currentUser$.value?.role against allowed list
- Redirects to '/profile' with notification if role not allowed

AddPropertyComponent form (Reactive Forms):
Section 1 — Basic Info:
  title (required, min 10 chars)
  description (required, min 20 chars)
  type: select ['apartment','villa','house','studio','office','shop','land','commercial']
  listingType: radio ['sale','rent']
  price (required, number > 0)

Section 2 — Location:
  city (required), district (required), street

Section 3 — Details:
  bedrooms, bathrooms, area (m²)

Section 4 — Images:
  Multi-file upload input (max 10 files, JPEG/PNG/WEBP only)
  Preview thumbnails with remove button
  On submit: first POST each image to /api/v1/properties/:id/images using FormData
  (Create property first, then upload images to the returned ID)

Submit flow:
1. POST /api/v1/properties with all text fields → receive property._id
2. For each selected image: POST FormData to /api/v1/properties/{id}/images
3. Show progress percentage
4. On complete: notificationService.show('Property submitted for admin approval!', 'success')
5. router.navigate(['/profile'])

Note: backend requires admin approval (isApproved flag) before listing appears publicly.
```

---

#### Task 4.4 — Add Agents API to Backend

**Problem:** Frontend `AgentsComponent` always falls back to mock data because `/agents` doesn't exist in the backend.

**Prompt:**
```
Add an Agents API endpoint to the Luxe Estates Express 5 / Node.js backend.

Create src/routes/agents.routes.js:
  GET /api/v1/agents — returns all users where role IN ['agent','owner'] AND isVerified=true AND isActive=true AND isApproved=true (add isApproved field to User model if not present)
  
  Query: User.find({ role: { $in: ['agent', 'owner'] }, isVerified: true, isActive: true })
          .select('name email role bio phone kycStatus createdAt')
          .sort({ createdAt: -1 })
          .limit(20)

  Response shape to match frontend Agent interface:
  {
    success: true,
    data: [
      { 
        _id, name, email, role, bio, phone,
        // computed fields:
        specialty: bio || 'Luxury Real Estate',
        rating: 4.8,  // compute from reviews avg later
        salesCount: 0  // compute from completed bookings later
      }
    ]
  }

Also add isApproved and bio and phone fields to User model if missing.
Register the route in server.js: app.use('/api/v1/agents', require('./routes/agents.routes'))
Apply: optional auth middleware (agents list is public), cache(300) middleware.
Add Swagger JSDoc to the route file following existing project conventions.
```

---

#### Task 4.5 — Fix Backend Known Issues

**Prompt:**
```
Fix the following medium-severity issues in the Luxe Estates Node.js/Express 5 backend 
identified in the code audit:

1. APIFeatures.search() in src/utils/apiFeatures.js:
   Replace the $regex approach with $text index search:
   this.query = this.query.find({ $text: { $search: this.queryString.search } });
   This uses the existing full-text index on title+description+city+district.

2. user.controller.js — getMe() function:
   Replace sequential await calls with Promise.all():
   const [bookings, properties, favorites] = await Promise.all([
     Booking.find(...), Property.find(...), Favorite.find(...)
   ]);
   
3. getAllUsers admin endpoint in user.controller.js:
   Add .select('-password -otpHash -passwordResetToken -bankAccounts -tokenVersion')
   to prevent sensitive field exposure.

4. server.js root endpoint: change version string from '3.0.0' to '4.0.0' to match package.json.

5. Mixed error handling — wrap remaining raw try/catch blocks in auth.controller.js 
   with the existing asyncHandler utility for consistency.

Show the complete updated sections of each file.
```

---

#### Task 4.6 — E2E Environment & CORS Fix

**Prompt:**
```
Configure CORS and environment variables correctly for the Luxe Estates full-stack project 
running locally and in production.

Backend (server.js / .env):
1. Development .env:
   CLIENT_URL=http://localhost:4200
   PORT=3000
   NODE_ENV=development

2. Production .env (Railway):
   CLIENT_URL=https://your-frontend-domain.com
   PORT=3000
   NODE_ENV=production

3. Verify CORS config accepts both http://localhost:4200 (dev) and prod URL.
   Backend already fails closed on missing CLIENT_URL — confirm this works.

Frontend:
1. src/environments/environment.ts:
   apiUrl: 'http://localhost:3000/api/v1'
   
2. src/environments/environment.prod.ts:  
   apiUrl: 'https://your-railway-domain.railway.app/api/v1'

3. In angular.json, confirm fileReplacements for production build points to environment.prod.ts.

4. Add a proxy.conf.json for local development to avoid CORS issues during ng serve:
   Create proxy.conf.json at project root:
   { "/api": { "target": "http://localhost:3000", "secure": false, "changeOrigin": true } }
   Update angular.json serve options: "proxyConfig": "proxy.conf.json"
   With this proxy, frontend calls /api/v1/... and proxy forwards to backend.
   Update environment.ts: apiUrl: '/api/v1' (relative, goes through proxy)

Show all files that need to be created or modified.
```

---

## Part 4 — Compatibility Score & Summary

### Current Frontend ↔ Backend Compatibility: **28 / 100**

| Category | Score | Reason |
|---|---|---|
| Auth endpoints | 7/10 | Correct paths but hardcoded URL, no token refresh |
| Properties API | 3/10 | Wrong port, missing /v1/ prefix |
| Auctions API | 3/10 | Same URL issues |
| Favorites API | 1/10 | Wrong HTTP signature |
| Viewings API | 1/10 | Wrong path name |
| Agents API | 0/10 | Backend endpoint doesn't exist |
| KYC flow | 0/10 | Completely absent from frontend |
| Payments | 0/10 | Completely absent from frontend |
| Socket.IO | 0/10 | No client integration |
| Role system | 3/10 | Invalid role value written to storage |

### After Completing All Tasks: **~95 / 100**

---

## Part 5 — Execution Order Summary

```
Week 1 — Foundation (Tasks 1.1 → 1.3):    Fix URLs, roles, token refresh
Week 2 — Core UX (Tasks 2.1 → 2.4):       OTP verify, search nav, profile page, property detail
Week 3 — Advanced (Tasks 3.1 → 3.4):      Socket.IO, KYC, agent upgrade, notifications
Week 4 — Production (Tasks 4.1 → 4.6):    Pagination, errors, add-property, agents API, backend fixes, CORS
```

**Estimated effort:** 3–4 developers × 3 weeks at moderate pace.

---

*Report generated by Senior Full-Stack Review · Luxe Estates v0.1 → Production · April 2026*
