# FitConnect Pro — Full Testing Checklist (Web + Mobile)

Assume **zero prior QA**. This plan seeds dummy data into Firebase so every screen renders real states (classes, spots, credits, bookings, facility, trainers) exactly as it will with production data. Work top-down; each section is independent unless marked **→ depends on §N**.

Stack reminder: Next.js 16 App Router on `localhost:3000`, Expo on iOS sim, Firebase (Firestore + Auth + Admin SDK on API routes). All booking writes are server-side only (Firestore rules block client writes to `bookings`/`payments`).

---

## 0. Pre-flight

- [ ] `.env.local` has `FIREBASE_SERVICE_ACCOUNT` (service-account JSON, private key uses literal `\n`)
- [ ] `.env.local` has `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, appId, messagingSenderId)
- [ ] `mobile/.env` has matching `EXPO_PUBLIC_FIREBASE_*` vars and `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000` (or LAN IP if on device)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`) — client writes to `bookings`/`payments` MUST fail
- [ ] Firestore composite indexes deployed (`firebase deploy --only firestore:indexes`) — the classes-by-date query needs them
- [ ] Turbopack cache clean on macOS: `rm -rf .next && mkdir -p .next && xattr -cr .next && npm run dev`
- [ ] `npm run dev` up on `:3000`; `cd mobile && npx expo start --ios` up

---

## 1. Seed Dummy Data

Goal: make the app look real. You need data in **6 collections**: `users`, `admins`, `trainers`, `gymCenters`, `classes`, and the system under test will write `bookings` + `payments` for you.

### 1.1 Create auth users (do this in Firebase Console → Authentication → Users, or via Signup flow)

| Role | Email | Password | Purpose |
|---|---|---|---|
| Admin | `admin@solpilates.test` | `Admin123!` | Admin dashboard |
| Member A (unlimited) | `alice@test.com` | `Alice123!` | Happy-path bookings |
| Member B (limited) | `bob@test.com` | `Bob123!` | Credit-exhaustion tests |
| Member C (no plan) | `carol@test.com` | `Carol123!` | No-subscription edge cases |
| Member D (expired) | `dave@test.com` | `Dave123!` | Expired-plan edge cases |

After auth user creation, the signup flow creates `users/{uid}` — but for admin/members you haven't signed up with, create the doc manually (see below).

### 1.2 Promote the admin (custom claim)

The `set-role` API requires an existing admin. For the **first** admin, run a one-off script or use Firebase Console → Cloud Functions shell:

```js
// One-shot in an Admin SDK REPL (Node):
await admin.auth().setCustomUserClaims('<ADMIN_UID>', { admin: true });
await admin.firestore().collection('admins').doc('<ADMIN_UID>').set({
  uid: '<ADMIN_UID>',
  email: 'admin@solpilates.test',
  name: 'Sol Admin',
  role: 'super_admin',
  grantedAt: admin.firestore.FieldValue.serverTimestamp(),
  grantedBy: '<ADMIN_UID>',
});
```

Verify: sign in at `/admin/login` with that email — you should reach `/admin/dashboard`, not be bounced back.

### 1.3 Seed `users/{uid}` docs (shape from `shared/src/types/user.ts`)

For each member, create the doc. Example for Alice (unlimited, active):

```json
{
  "uid": "<ALICE_UID>",
  "email": "alice@test.com",
  "name": "Alice Rivera",
  "age": 32,
  "fitnessGoals": ["strength", "flexibility"],
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>",
  "subscription": {
    "planId": "unlimited",
    "planCategory": "membership",
    "startDate": "<now>",
    "endDate": "<now + 28 days>",
    "status": "active",
    "classesRemaining": null,
    "maxClassesPerDay": 2,
    "advanceBookingDays": 14,
    "guestPassesRemaining": 2,
    "lastPaymentId": null,
    "stripeCustomerId": null,
    "stripeSubscriptionId": null
  },
  "stats": { "totalClassesAttended": 7, "currentStreak": 3, "longestStreak": 5 }
}
```

Variations:
- **Bob** — `planId: "once_weekly"`, `classesRemaining: 1`, `endDate: now + 28d`. Used to exhaust credits.
- **Carol** — `subscription.planId: null`, `status: "canceled"`, `classesRemaining: 0`. Used to test "no plan" prompts + payment flow.
- **Dave** — `planId: "five_pack"`, `endDate: now - 1 day`, `status: "expired"`.

### 1.4 Seed `gymCenters` (one doc — single facility)

Doc ID `main` (or any; code reads "the first one"):

```json
{
  "id": "main",
  "name": "Sol Pilates Studio",
  "address": { "street": "250 West 54th", "city": "New York", "state": "NY", "zip": "10019", "country": "USA" },
  "coordinates": { "lat": 40.7649, "lng": -73.9827 },
  "contactInfo": { "phone": "+1 (212) 555-0180", "email": "hello@solpilates.test" },
  "operatingHours": {
    "monday":    { "open": "06:00", "close": "21:00" },
    "tuesday":   { "open": "06:00", "close": "21:00" },
    "wednesday": { "open": "06:00", "close": "21:00" },
    "thursday":  { "open": "06:00", "close": "21:00" },
    "friday":    { "open": "06:00", "close": "20:00" },
    "saturday":  { "open": "08:00", "close": "18:00" },
    "sunday":    { "open": "08:00", "close": "18:00" }
  },
  "facilities": "Reformers, Tower, Cadillac, Chair, Locker rooms, Showers, Filtered water, Herbal tea bar",
  "photos": [],
  "isActive": true,
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

Also test the alternate `facilities` shape — change it to an array `["Reformers","Tower","Locker rooms"]` and confirm `parseFacilities` still renders pills (see §6 Facility tab).

### 1.5 Seed `trainers` (seed 4 so the grid isn't lopsided)

Doc shape from `shared/src/types/trainer.ts`. Minimum viable:

```json
{
  "id": "<auto>",
  "name": "Maya Chen",
  "email": "maya@solpilates.test",
  "phone": "+1 212 555 0101",
  "bio": "Classical Pilates lineage, 8 years teaching reformer.",
  "certifications": ["Power Pilates Comprehensive", "BASI"],
  "specialties": ["Reformer", "Pre/Postnatal"],
  "profilePictureUrl": "",
  "experienceYears": 8,
  "rating": 4.9,
  "isActive": true,
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

Seed **Maya Chen**, **Julien Okafor**, **Priya Kapoor**, plus **one with `isActive: false`** to confirm it's filtered out.

### 1.6 Seed `classes` — this is the load-bearing collection

Shape from `shared/src/types/class.ts`. Dates must be Firestore `Timestamp`. Seed the following matrix **relative to today**:

| # | Day | Start | Trainer | Capacity | totalSpots | bookedSpots | Purpose |
|---|---|---|---|---|---|---|---|
| 1 | Today | `06:00` | Maya | 12 | 12 | `[]` | Empty class — tests default spot grid |
| 2 | Today | `09:00` | Julien | 12 | 12 | `[1,3,5]` | Partial bookings — tests grey-out |
| 3 | Today | `17:30` | Priya | 10 | 10 | `[1,2,3,4,5,6,7,8,9,10]` | **FULL** — tests "Full" state |
| 4 | Today | `19:00` | Maya | 12 | 12 | `[2,4,6,8,10,12]` (6 booked) | "≤50% left" amber indicator |
| 5 | Tomorrow | `07:00` | Julien | 8 | 8 | `[]` | Tomorrow tab + calendar strip |
| 6 | +3 days | `08:00` | Priya | 12 | 12 | `[]` | Future date navigation |
| 7 | +14 days | `10:00` | Maya | 12 | 12 | `[]` | Edge: **exactly** at `advanceBookingDays` limit for Alice |
| 8 | +15 days | `10:00` | Maya | 12 | 12 | `[]` | Edge: **past** Alice's booking horizon (should reject) |
| 9 | Yesterday | `10:00` | Maya | 12 | 12 | `[1,2,3]` + `status: "completed"` | Past class — tests "Past" bookings tab |
| 10 | Today | `14:00` | Julien | 12 | 12 | `[]` + `status: "canceled"` | Canceled class — should not appear in schedule |

Required fields on every class:
```json
{
  "trainerId": "<doc id from §1.5>",
  "date": "<Timestamp at 00:00 of class day>",
  "startTime": "06:00",
  "duration": 50,
  "capacity": 12,
  "bookedCount": 0,
  "classType": "Reformer Flow",
  "difficultyLevel": "intermediate",
  "status": "scheduled",
  "totalSpots": 12,
  "bookedSpots": [],
  "location": "Performance Floor",
  "intensityLevel": 2,
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

**Sanity check the seed:**
- [ ] `classes` has ~10 docs with dates spanning yesterday → +15 days
- [ ] Trainers referenced in `classes.trainerId` all exist in `trainers`
- [ ] Class #3 has `bookedSpots.length === totalSpots` (full)
- [ ] `users` has 4 members + 1 admin; `admins` has 1 doc

---

## 2. Smoke + Type Safety (run once before manual tests)

```bash
npx tsc --noEmit                   # web
cd shared && npx tsc --noEmit      # shared
cd functions && npx tsc --noEmit   # functions
cd shared && npx vitest run        # shared unit tests
cd mobile && npx vitest run        # mobile unit tests
npm run build                      # production build — catches most runtime issues
npm run lint
```

- [ ] All five commands exit 0. If `tsc` fails, **fix before manual testing** — your dummy data doesn't matter if types are wrong.

---

## 3. Marketing Site (public, no auth)

Routes: `/`, `/about`, `/contact`, `/facilities`, `/subscription`.

- [ ] Hero loads with background image + CTA; no console errors
- [ ] "Get Started" button opens `GetStartedModal`
- [ ] Modal → "Sign Up" path renders `SignupModal`, "Log In" renders `LoginModal`
- [ ] Signup as a new email → writes `users/{uid}` in Firestore (verify in console) → redirects into the user area
- [ ] Service cards (STRENGTH & SCULPT, CARDIO, etc.) all render images from `/public/images/service-*.jpg`
- [ ] `/subscription` shows all 6 plans from `PLAN_CATALOG` with prices `$200 / $160 / $120 / $35 / $160 / $300`
- [ ] `/facilities` pulls the `gymCenters` doc and renders address + hours; facilities pills render
- [ ] All links in nav + footer respond; no 404s
- [ ] Mobile viewport (Chrome devtools, 375px): no horizontal scroll, tap targets ≥44px

---

## 4. Web — User Auth (`/user/login`, `LoginModal`, `SignupModal`)

- [ ] Login with Alice → redirects to `/user/dashboard` (not `/admin`)
- [ ] Bad password → error surfaces in modal, no redirect
- [ ] Signup with new email `eve@test.com` → Firestore `users/{uid}` doc created with default `subscription.planId: null`
- [ ] Signup with existing email → friendly error
- [ ] `/user/dashboard` while logged out → bounces to `/user/login`
- [ ] Hard refresh while signed in → session persists (Firebase auth persistence)
- [ ] Logout from `UserNav` → redirects to `/`, can't reach `/user/dashboard` without re-auth

---

## 5. Web — User Dashboard (`/user/dashboard`)

Sign in as **Alice (unlimited)**.

- [ ] Greeting uses first name only and matches local hour (`<12` morning / `<17` afternoon / else evening)
- [ ] `SubscriptionWidget` shows plan name "Unlimited", status Active, ∞ credits
- [ ] "Upcoming Session" card: either a booking (if you've booked one) or "Browse Schedule" CTA
- [ ] "Today at the Studio" lists seed classes #1–#4, #10 hidden (canceled), #3 marked "Full"
- [ ] Spots indicator: green (class #1), amber (class #4, ≤50%), red/Full (class #3)
- [ ] "Book a Class" quick action → `/user/schedule`
- [ ] "My Bookings" → `/user/bookings`

Sign out, sign in as **Carol (no plan)**:

- [ ] Widget shows "View Plans" CTA, routes to `/user/subscribe`
- [ ] `SubscriptionPromptModal` appears when trying to book (see §7)

---

## 6. Web — Schedule & Facility (`/user/schedule`)

As Alice.

### Facility header
- [ ] FLAGSHIP badge + stars + review count render
- [ ] Address pulls from `gymCenters.address` (changing the city in Firestore should live-reflect)
- [ ] Section tabs sticky on scroll (Schedule / Trainers / Facility)

### Schedule tab
- [ ] `CalendarStrip` shows 14 days from today
- [ ] Tapping today → classes #1, #2, #3, #4 appear
- [ ] Canceled class #10 does **not** appear
- [ ] Tomorrow → class #5 only
- [ ] +3 days → class #6 only
- [ ] Empty day (+5 days) → calendar empty state
- [ ] Each `ClassCard` renders trainer initials + first name; "Full" flag on #3; amber dot on #4
- [ ] "Today" button only appears when viewing a non-today date

### Trainers tab
- [ ] 3 cards render (the `isActive: false` trainer is filtered out)
- [ ] Specialty + initials visible; no broken avatar

### Facility tab
- [ ] About + amenity pills render
- [ ] Change `facilities` to an array in Firestore and reload — still renders pills (covers `parseFacilities`)
- [ ] Delete the `gymCenters` doc temporarily — page falls back to `FALLBACK_FACILITY` (re-seed after)

---

## 7. Web — Spot Selection & Booking (`SpotSelectionModal`) → depends on §1.6

**Positive path (Alice, unlimited):**
- [ ] Click class #2 → modal opens; spots 1, 3, 5 greyed out
- [ ] Pick spot 7 → highlighted; "Confirm" enabled
- [ ] Confirm → `POST /api/bookings/book` fires, modal closes
- [ ] Verify in Firestore: `bookings` has new doc with `userId: <ALICE_UID>`, `spotNumber: 7`, `status: "confirmed"`
- [ ] Class #2 `bookedSpots` now includes 7; `bookedCount` incremented
- [ ] Dashboard "Upcoming Session" updates live (onSnapshot listener)
- [ ] Alice's `users.subscription.classesRemaining` stays `null` (unlimited — should NOT decrement)

**Credit decrement (Bob, Once Weekly, 1 credit left):**
- [ ] Book one class → `classesRemaining` drops to 0 in Firestore
- [ ] Try to book another → server rejects with "No credits remaining" (or similar); UI shows error alert
- [ ] Cancel the booking (§9) → `classesRemaining` refunds to 1

**No-plan path (Carol):**
- [ ] Click any class → modal or toast routes to `/user/subscribe` (or blocks with "need subscription")
- [ ] Confirm no `bookings` doc was created

**Expired plan (Dave):**
- [ ] Click any class → server rejects ("subscription expired"); no booking created

**Race condition / real-time spot collision:**
- [ ] Open class #2 in two browsers (Alice + Bob)
- [ ] Both pick spot 7
- [ ] First to confirm wins; second gets "Spot 7 was just booked…" alert and selection clears

**Advance-booking horizon:**
- [ ] Alice books class #7 (exactly +14 days) → succeeds (`advanceBookingDays: 14`)
- [ ] Alice books class #8 (+15 days) → server rejects with "too far in advance"

**Daily cap (`maxClassesPerDay: 2`):**
- [ ] Book 2 classes on the same day as Alice → 3rd on the same day rejected

**Guest pass:**
- [ ] Book with `isGuest: true` and a `guestName` → `users.subscription.guestPassesRemaining` decrements; booking has `usedGuestPass: true`
- [ ] Exhaust passes → next guest booking rejected

**Fast-click guard:**
- [ ] Mash "Confirm" 5x quickly → only one booking created, not five

---

## 8. Web — Bookings (`/user/bookings`)

As Alice, after seeding at least one upcoming + one past booking (§1.6 class #9 is past).

- [ ] Header + Upcoming/Past tabs render
- [ ] Upcoming sorted earliest first; Past sorted newest first
- [ ] Status badges: confirmed (terracotta), attended (green), canceled (red), no-show (red)
- [ ] Cancel a confirmed upcoming → confirm dialog → success alert
- [ ] After cancel: row disappears from Upcoming; Firestore `bookings/{id}.status: "canceled"` + `canceledAt` set; credit refunded (for Bob)
- [ ] Real-time: cancel from another tab → row vanishes here without refresh
- [ ] Upcoming empty → "Browse Schedule" CTA → `/user/schedule`
- [ ] Past empty → no CTA
- [ ] Guest badge appears when `booking.isGuest === true`

---

## 9. Web — Subscribe Flow (`/user/subscribe`)

As Carol (no plan).

### Step 1 — Plan
- [ ] Tab toggle MEMBERSHIPS / CLASS PACKS; switching clears selection
- [ ] All 6 plans from `PLAN_CATALOG` render (Unlimited $200, Twice Weekly $160, Once Weekly $120, Drop-In $35, 5 Pack $160, 10 Pack $300)
- [ ] "Popular" badge on the recommended plan
- [ ] Continue disabled until a plan is selected

### Step 2 — Checkout (`MockPaymentForm`)
- [ ] Card number auto-formats `#### #### #### ####`, caps at 16
- [ ] Visa detected on `4...`, Mastercard on `51–55` or `22–27`, Amex on `34/37`
- [ ] Expiry formats `MM/YY`; CVC digits only, 3–4
- [ ] Use success card: `4242 4242 4242 4242`, any future expiry, any CVC → payment succeeds
- [ ] Use decline card: **any number ending in `0000`** (e.g. `4242 4242 4242 0000`) → "Your card was declined" alert, no subscription applied
- [ ] On success: `POST /api/subscriptions/activate` → `payments` doc created with `status: "succeeded"` → `users/{carol}.subscription` updated with `planId`, `endDate = now + durationDays`
- [ ] On failure: `payments` doc has `status: "failed"`, `users.subscription` unchanged

### Step 3 — Success
- [ ] Shows plan name, credits (∞ or N), "Valid Until" formatted date
- [ ] "Go to Dashboard" → `/user/dashboard` with the new plan reflected
- [ ] Back button after success is a `replace`, no history back into checkout

### Edge cases
- [ ] Backgrounding the tab mid-payment does not double-charge (refresh — only one `payments` doc)
- [ ] Network offline when hitting Pay → error surfaces, no partial state

---

## 10. Web — Profile (`/user/profile`)

- [ ] Avatar initials: 2 letters multi-word, 1 if single
- [ ] Name + email display; plan badge correct
- [ ] Stats (attended, credits, streak) match `users/{uid}.stats` + `subscription.classesRemaining`
- [ ] Membership tile "Renews" / "Expires" matches `subscription.autoRenew` (or the equivalent field in your schema)
- [ ] Change Password collapsible: empty fields alert, mismatch alert, <6 chars alert, wrong current password → Firebase error, success clears fields
- [ ] Sign Out confirm → logs out and routes to `/user/login`

---

## 11. Web — Admin (sign in as admin@solpilates.test at `/admin/login`)

Routes: `/admin/dashboard`, `/bookings`, `/classes`, `/locations`, `/members`, `/reports`, `/settings`, `/trainers`.

- [ ] Non-admin member hitting `/admin/dashboard` → bounced to `/admin/login`
- [ ] Admin dashboard stats populated: `totalMembers=5`, `todaysClasses≈4`, `todayBookings` matches what you booked, `totalBookings` matches Firestore count
- [ ] Recent bookings table lists the bookings you created in §7
- [ ] Weekly chart renders (recharts) without NaN bars

### Admin — Classes (`/admin/classes`)
- [ ] Table lists seeded classes (incl. canceled class #10)
- [ ] Create new class form: pick trainer, date, start time, capacity → writes to `classes` collection
- [ ] Edit existing class → `updatedAt` changes
- [ ] Cancel a class → `status: "canceled"`, disappears from user Schedule
- [ ] Delete → doc removed from Firestore

### Admin — Members (`/admin/members`)
- [ ] Lists all 4 members; filters by plan status
- [ ] Clicking Alice shows subscription, stats, recent bookings
- [ ] Edit credits (if supported) → writes to `users.subscription.classesRemaining`

### Admin — Trainers (`/admin/trainers`)
- [ ] Lists 4 seeded (3 active + 1 inactive); toggling active writes to `trainers/{id}.isActive`
- [ ] Create / edit form persists

### Admin — Locations (`/admin/locations`)
- [ ] Renders `gymCenters` doc; editing address + hours + facilities saves
- [ ] User-side `/facilities` reflects changes on next load

### Admin — Bookings (`/admin/bookings`)
- [ ] All bookings across members; filters by status (confirmed/canceled/attended/no-show)
- [ ] Marking a booking "attended" updates Firestore + bumps `users/{uid}.stats.totalClassesAttended`

### Admin — Reports (`/admin/reports`)
- [ ] Revenue, bookings, attendance charts render without errors; totals match Firestore

### Admin — Settings (`/admin/settings`)
- [ ] Known gap per CLAUDE.md: **no backend persistence** — toggles reset on reload. Confirm this is still the case or flag if fixed.

### Admin privilege escalation
- [ ] Calling `POST /api/admin/set-role` without admin token → 403
- [ ] With admin token, promoting another user → custom claim set (`admin.auth().getUser(uid).customClaims.admin === true`), `admins/{uid}` doc created
- [ ] Demoting → claim cleared, `admins/{uid}` deleted

---

## 12. Firestore Security Rules (don't skip — this is where silent prod breaks happen)

Try these from a **signed-in non-admin** browser console. Each must **fail**:

```js
const { getFirestore, doc, updateDoc, addDoc, collection } = await import('firebase/firestore');
const db = getFirestore();

// MUST FAIL — client writes to bookings are blocked
await addDoc(collection(db, 'bookings'), { fake: true });          // → permission-denied
await updateDoc(doc(db, 'bookings', '<any id>'), { status: 'x' }); // → permission-denied

// MUST FAIL — client writes to payments blocked
await addDoc(collection(db, 'payments'), { amount: 0 });            // → permission-denied

// MUST FAIL — can't read another user's profile
await getDoc(doc(db, 'users', '<other uid>'));                      // → permission-denied

// MUST FAIL — can't write classes / trainers / gymCenters as non-admin
await addDoc(collection(db, 'classes'), {});                        // → permission-denied
```

- [ ] All five denials happen
- [ ] As admin: the same writes succeed (or are still routed through API in the app flow)

---

## 13. Mobile — re-run §3–10 on the iOS sim

Shape is the same as web (same Firestore, same API). Additional mobile-only things to verify:

### Boot & routing (`app/index.tsx`, `_layout.tsx`)
- [ ] Cold launch spinner while `initAuth()` runs; authed → `/(tabs)`, not → `/login`
- [ ] `initApiConfig` runs before any API call
- [ ] Status bar color adapts to light/dark background

### Login / Signup (`app/login.tsx`)
- [ ] Sign In tab: email keyboard, no autocapitalize; password eye toggle; return-key chain focuses next field
- [ ] Empty / wrong creds → native alert
- [ ] Sign Up tab: name autocapitalizes words; mismatch + <6 char + duplicate email errors
- [ ] Fields locked while verifying
- [ ] `/signup` deep link → redirects to `/login`

### Tab shell
- [ ] 4 tabs render (Home/Schedule/Bookings/Profile); coral indicator on active
- [ ] iOS tab bar height 88 with safe-area padding; Android 64

### Dashboard (tabs/index)
- [ ] Welcome banner greeting, first-name only, stats row with ∞ for unlimited
- [ ] Decorative circles at 6% / 4% / 3% opacity (not overdone)
- [ ] Subscription card: no-plan → terracotta; active → plan name, progress bar proportional, capped at 100%; unlimited → bar at 100%
- [ ] Upcoming Session: loading spinner → card; real-time updates after booking in Schedule
- [ ] "Today at the Studio": green >3 left, amber ≤3, "Full" when full; empty state when none

### Schedule (tabs/schedule)
- [ ] All §6 checks pass on mobile
- [ ] CalendarStrip scrolls to center selected day automatically
- [ ] Date header reads "Friday, 18 April 2026" (matches locale)

### SpotSelector modal
- [ ] 4-column grid; real-time spot grey-out when someone else books
- [ ] Confirmed booking → modal closes, schedule reloads, dashboard updates

### Bookings (tabs/bookings)
- [ ] All §8 checks pass
- [ ] Pull-to-refresh works with `RefreshControl` (2s safety timeout)
- [ ] Cancel spinner is per-card, others stay interactive

### Profile (tabs/profile)
- [ ] Change Password collapsible; chevron animates 0°→90°
- [ ] Three independent eye toggles
- [ ] Sign Out confirm → `logoutClient` → `/login`
- [ ] Version footer "SOL PILATES STUDIO · v1.0.0"

### Subscribe flow (app/subscribe)
- [ ] All §9 checks pass on mobile; button state cycles idle → PROCESSING → PAYMENT SUCCESSFUL → step 3
- [ ] Back button on step 2 clears payment state

### Mobile-specific cross-cutting
- [ ] Auth persists across force-quit
- [ ] Airplane mode: screens render gracefully, no white crash; reconnect resumes real-time listeners
- [ ] iPhone SE small screen: all forms scrollable, no clipped buttons
- [ ] iPhone 16 Pro: safe-area respected (no content under notch / home indicator)
- [ ] Fast-tap / double-tap does not duplicate bookings

---

## 14. Known gotchas to deliberately exercise

- `getClassesByDate` on web/mobile Dashboard runs once at mount — switching days should NOT change the "Today at the Studio" list until page reload
- `SpotSelector`'s real-time listener closes over `selectedSpot` — verify collision detection with two signed-in clients picking the same spot
- `isUpcoming` in Bookings normalizes to midnight, so a 2pm class today is still "Upcoming" at 3pm — confirm this matches product intent
- `classDate` arrives as Date / string / Firestore Timestamp from different call sites — scan for `Invalid Date` anywhere
- `parseFacilities` returns `[]` for unexpected shapes — test both string and array (per §1.4)
- Admin credentials hardcoded at `src/types/admin.ts` is flagged CRITICAL in CLAUDE.md — the file is also shown as deleted in git status; verify your login flow actually uses Firebase custom claims and NOT the hardcoded `admin/admin123`
- Settings page has no backend persistence (per CLAUDE.md) — verify or flag

---

## 15. Cleanup after testing

- [ ] Delete test users: `node scripts/delete-user.mjs <email> --execute` (drops Auth user + `users/{uid}` + their bookings)
- [ ] Delete `payments` + `bookings` left over from failed runs (Firestore console bulk delete or a one-off Admin SDK script)
- [ ] Reset `users/<admin>.customClaims.admin` to false if you don't want that account kept as admin
- [ ] Confirm `classes` collection is back to a clean schedule (or drop it entirely and re-seed)
