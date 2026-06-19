# FitConnect Pro — Backend Services & Flow Documentation

> **Purpose:** Complete reference of every backend service, API route, Cloud Function, scheduled job, and webhook — with file paths, entry points, and data flow.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Firebase Collections (Database Schema)](#2-firebase-collections-database-schema)
3. [Next.js API Routes](#3-nextjs-api-routes)
4. [Firebase Cloud Functions](#4-firebase-cloud-functions)
5. [Scheduled / Cron Jobs](#5-scheduled--cron-jobs)
6. [Razorpay Webhooks](#6-razorpay-webhooks)
7. [Shared Backend Utilities](#7-shared-backend-utilities)
8. [Authentication & Authorization Flow](#8-authentication--authorization-flow)
9. [Data Flow Diagrams](#9-data-flow-diagrams)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Next.js Web │    │ Expo Mobile  │    │  (Future)    │  │
│  │  (Vercel)    │    │  (EAS Build) │    │              │  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘  │
│         │                   │                               │
│         │  apiFetch()       │  apiFetch()                   │
│         │  Bearer token     │  Bearer token                 │
│         ▼                   ▼                               │
├─────────────────────────────────────────────────────────────┤
│                   NEXT.JS API ROUTES                        │
│                   src/app/api/                              │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │  Bookings   │ │  Payments  │ │  Admin     │             │
│  │  /api/      │ │  /api/     │ │  /api/     │             │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘             │
│        │              │              │                      │
│        ▼              ▼              ▼                      │
├─────────────────────────────────────────────────────────────┤
│              FIREBASE ADMIN SDK (server-side)               │
│              src/lib/firebase/admin.ts                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Firestore │  │   Auth   │  │  Storage │  │ Webhooks │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│              FIREBASE CLOUD FUNCTIONS                       │
│              functions/src/                                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Triggers │  │  Callable │  │ Scheduled│  │   Seed   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│              EXTERNAL SERVICES                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Razorpay   │  │ Firebase Auth│                        │
│  │ (Payments)   │  │ (Identity)   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **Two parallel backend systems**: Next.js API routes (primary, production) + Firebase Cloud Functions (legacy, mobile-first). Both share the same Firestore database.
- **Shared package** (`@fitconnect/shared`): Contains all TypeScript types, Zustand stores, Firestore query helpers, and payment processor utilities. Consumed by both web and mobile.
- **Authentication**: Firebase Auth with custom claims (`admin: true`). Bearer tokens sent via `Authorization` header.
- **Payments**: Razorpay (India). Two flows: one-time orders (class packs) and recurring subscriptions (memberships).

---

## 2. Firebase Collections (Database Schema)

```
firestore/
├── classes/              # Class sessions
│   ├── id: string
│   ├── trainerId: string (→ trainers/{id})
│   ├── date: Timestamp
│   ├── startTime: string ("08:00")
│   ├── duration: number (minutes)
│   ├── capacity: number
│   ├── totalSpots: number
│   ├── bookedCount: number
│   ├── bookedSpots: number[] (e.g. [1, 3, 5])
│   ├── classType: string ("Sol Flow" | "Sol Cardio" | "Sol Stretch" | "Intro Class")
│   ├── difficultyLevel: "beginner" | "intermediate" | "advanced"
│   ├── status: "scheduled" | "ongoing" | "completed" | "canceled"
│   ├── location: string
│   ├── intensityLevel: 1 | 2 | 3
│   └── description: string
│
├── bookings/
│   └── {bookingId}
│       ├── userId: string
│       ├── userName: string
│       ├── classId: string
│       ├── trainerId: string
│       ├── classDate: Timestamp
│       ├── bookingDate: Timestamp
│       ├── status: "confirmed" | "attended" | "canceled" | "no-show"
│       ├── spotNumber: number
│       ├── isGuest: boolean
│       ├── guestName: string
│       ├── creditType: "standard" | "unlimited" | "guest_pass" | "intro_credit"
│       ├── planIdAtBooking: string | null
│       ├── usedGuestPass: boolean
│       ├── usedIntroCredit: boolean
│       └── canceledAt: Timestamp | null
│
├── users/
│   └── {uid}
│       ├── uid: string
│       ├── email: string
│       ├── name: string
│       ├── age: number
│       ├── fitnessGoals: string[]
│       ├── profilePictureUrl: string | null
│       ├── isFoundingMember: boolean
│       ├── foundingWaitlistId: string | null
│       ├── subscription: {
│       │     planId: string | null,
│       │     planCategory: "membership" | "class_pack" | null,
│       │     startDate: Timestamp | null,
│       │     endDate: Timestamp | null,
│       │     status: "active" | "expired" | "canceled" | "halted",
│       │     classesRemaining: number | null,  // null = unlimited
│       │     introCreditRemaining: number,
│       │     maxClassesPerDay: number,
│       │     weeklyClassLimit: number,
│       │     advanceBookingDays: number,
│       │     guestPassesRemaining: number,
│       │     autoRenew: boolean,
│       │     cancelAtPeriodEnd: boolean,
│       │     canceledAt: Timestamp | null,
│       │     razorpaySubscriptionId: string | null,
│       │     razorpayPlanId: string | null,
│       │     lastPaymentId: string | null,
│       │     pendingPlanId: string | null,
│       │     pendingRazorpayPlanId: string | null,
│       │     pendingPlanEffectiveAt: Timestamp | null,
│       │     kickstarterCreditsCarriedForward: boolean,
│       │     carriedForwardCredits: number
│       │   }
│       └── stats: {
│             totalClassesAttended: number,
│             currentStreak: number,
│             longestStreak: number,
│             lastAttendedDate: Timestamp | null
│           }
│
├── trainers/
│   └── {trainerId}
│       ├── name, email, phone, bio
│       ├── certifications: string[]
│       ├── specialties: string[]
│       ├── profilePictureUrl: string
│       ├── experienceYears: number
│       ├── rating: number
│       └── isActive: boolean
│
├── gymCenters/
│   └── {facilityId}
│       ├── name: string
│       ├── address: { street, city, state, zip, country }
│       ├── coordinates: { lat, lng }
│       ├── contactInfo: { phone, email }
│       ├── operatingHours: { weekday, weekend }
│       ├── facilities: string
│       ├── photos: string[]
│       └── isActive: boolean
│
├── payments/
│   └── {paymentId}
│       ├── razorpayOrderId: string
│       ├── razorpayPaymentId: string
│       ├── razorpaySubscriptionId: string
│       ├── userId: string
│       ├── amount: number
│       ├── currency: string
│       ├── status: "pending" | "succeeded" | "failed" | "abandoned"
│       ├── planId: string
│       ├── kind: "subscription_create" | undefined
│       └── metadata: { planName, planCategory, credits, durationDays, ... }
│
├── introClassLeads/
│   └── {userId}
│       ├── name, email, phone, goals, concerns
│       ├── source: string
│       ├── status: "new"
│       ├── paymentStatus: "paid"
│       └── paymentId, razorpayOrderId, razorpayPaymentId
│
├── waitlist/
│   └── {waitlistId}
│       ├── email, emailLower
│       ├── status: "active" | "converted" | "archived"
│       └── claimedBy: string | null
│
├── admins/
│   └── {uid}
│       ├── email, name, role: "super_admin"
│       └── grantedAt, grantedBy
│
├── counters/
│   └── founding_members
│       └── count: number
│
├── razorpayWebhookEvents/
│   └── {eventId}
│       ├── event: string
│       ├── status: "processing" | "processed" | "failed"
│       └── receivedAt, processedAt
│
├── subscriptionChanges/
│   └── {changeId}
│       ├── userId, razorpaySubscriptionId
│       ├── fromPlanId, toPlanId
│       ├── scheduleChangeAt: "now" | "cycle_end"
│       └── status: "scheduled" | "applied"
│
└── paymentFailures/
    └── {docId}
        ├── razorpayPaymentId
        ├── orderId, subscriptionId
        └── errorDescription
```



## 3. Next.js API Routes

All routes are under `src/app/api/`. Each route file exports HTTP method handlers (`GET`, `POST`, `PUT`, `DELETE`).

### 3.1 Bookings

| Route | Method | File | Auth | Description |
|-------|--------|------|------|-------------|
| `/api/bookings` | GET | `src/app/api/bookings/route.ts` | User | Fetch all bookings for current user |
| `/api/bookings/book` | POST | `src/app/api/bookings/book/route.ts` | User | Book a class (transactional) |
| `/api/bookings/cancel` | POST | `src/app/api/bookings/cancel/route.ts` | User/Admin | Cancel a booking |
| `/api/bookings/checkin` | POST | `src/app/api/bookings/checkin/route.ts` | User/Admin | Mark booking as attended/no-show |

#### `POST /api/bookings/book` — Full Flow

```
1. Verify Bearer token → extract userId
2. Validate input: classId, spotNumber, isGuest, guestName
3. Run Firestore transaction:
   a. Read class document
   b. Read user document
   c. Validate class status = "scheduled"
   d. Validate class date is in the future
   e. Validate spot number ≤ total spots
   f. Validate spot not already taken (bookedSpots array)
   g. Validate capacity not exceeded (bookedCount < totalSpots)
   h. Validate user has active subscription
   i. Auto-expire check: if endDate < now → set status = "expired", reject
   j. Validate class date ≤ subscription endDate
   k. Intro plan → can only book Intro Class type
   l. Intro class → requires introCreditRemaining > 0
   m. Guest booking → requires guestPassesRemaining > 0
   n. Determine creditType: standard | unlimited | guest_pass | intro_credit
   o. Check daily limit (maxClassesPerDay, default 1)
   p. Check weekly limit (weeklyClassLimit, Mon-Sun window)
   q. Check for duplicate booking (same user + same class)
   r. Create booking document
   s. Update class: bookedCount++, bookedSpots.push(spotNumber)
   t. Decrement appropriate credit on user document
4. Return { success: true, bookingId }
```

#### `POST /api/bookings/cancel` — Full Flow

```
1. Verify Bearer token → extract userId + isAdmin
2. Validate input: bookingId
3. Run Firestore transaction:
   a. Read booking document
   b. Validate ownership (or admin)
   c. Validate status = "confirmed"
   d. Read class document
   e. Update booking status → "canceled"
   f. Release spot: class.bookedCount--, class.bookedSpots.remove(spotNumber)
   g. Restore credit based on creditType:
      - guest_pass → guestPassesRemaining++
      - intro_credit → introCreditRemaining++
      - unlimited → no-op
      - standard → classesRemaining++
4. Return { success: true }
```

---

### 3.2 Classes

| Route | Method | File | Auth | Description |
|-------|--------|------|------|-------------|
| `/api/classes` | POST | `src/app/api/classes/route.ts` | Admin | Create a class |
| `/api/classes` | PUT | `src/app/api/classes/route.ts` | Admin | Update a class |
| `/api/classes` | DELETE | `src/app/api/classes/route.ts` | Admin | Delete a class (cancels bookings) |

#### `POST /api/classes` — Create Class Flow

```
1. Verify admin token
2. Validate: trainerId, date (ISO), startTime (HH:MM), duration, capacity
3. Verify trainer exists in Firestore
4. Check for time conflict (no other active class at same date+time)
5. If classType = "Intro Class" → force duration = 30 min
6. Create class document with status = "scheduled"
7. Return { success: true, classId }
```

#### `DELETE /api/classes` — Delete Class Flow

```
1. Verify admin token
2. Find all confirmed bookings for this class
3. For each booking:
   a. Mark booking status → "canceled"
   b. Restore credit based on creditType
4. Hard-delete the class document
5. Return { success: true }
```

---

### 3.3 Payments

| Route | Method | File | Auth | Description |
|-------|--------|------|------|-------------|
| `/api/payments/create-order` | POST | `src/app/api/payments/create-order/route.ts` | User | Create Razorpay one-time order |
| `/api/payments/verify` | POST | `src/app/api/payments/verify/route.ts` | User | Verify payment + activate subscription |
| `/api/payments/create-subscription` | POST | `src/app/api/payments/create-subscription/route.ts` | User | Create Razorpay recurring subscription |
| `/api/payments/verify-subscription` | POST | `src/app/api/payments/verify-subscription/route.ts` | User | Verify subscription checkout |
| `/api/payments/abandon-subscription` | POST | `src/app/api/payments/abandon-subscription/route.ts` | User | Cancel abandoned subscription checkout |
| `/api/payments/create-intent` | POST | `src/app/api/payments/create-intent/route.ts` | User | Mock payment intent (dev) |
| `/api/payments/confirm` | POST | `src/app/api/payments/confirm/route.ts` | User | Confirm mock payment (dev) |

#### One-Time Payment Flow (Class Packs / Intro Class)

```
CLIENT                          API                           RAZORPAY
  │                               │                               │
  │  1. POST /payments/           │                               │
  │     create-order              │                               │
  │  { planId, metadata }         │                               │
  │──────────────────────────────►│                               │
  │                               │  2. Create Razorpay Order     │
  │                               │──────────────────────────────►│
  │                               │  { id, amount, currency }     │
  │                               │◄──────────────────────────────│
  │                               │                               │
  │                               │  3. Save payment doc          │
  │                               │     (status: "pending")       │
  │                               │                               │
  │  { orderId, paymentId,        │                               │
  │    amount, currency, key }    │                               │
  │◄──────────────────────────────│                               │
  │                               │                               │
  │  4. Open Razorpay Checkout    │                               │
  │──────────────────────────────────────────────────────────────►│
  │                               │                               │
  │  5. User completes payment    │                               │
  │◄──────────────────────────────────────────────────────────────│
  │                               │                               │
  │  6. POST /payments/verify     │                               │
  │  { razorpay_order_id,         │                               │
  │    razorpay_payment_id,       │                               │
  │    razorpay_signature,        │                               │
  │    paymentId }                │                               │
  │──────────────────────────────►│                               │
  │                               │  7. Verify HMAC signature     │
  │                               │                               │
  │                               │  8. Run transaction:          │
  │                               │     a. Mark payment succeeded │
  │                               │     b. Set user subscription  │
  │                               │     c. Calculate end date     │
  │                               │     d. Set credits            │
  │                               │     e. For intro: save lead   │
  │                               │                               │
  │  { success, endDate,          │                               │
  │    planId, credits }          │                               │
  │◄──────────────────────────────│                               │
```

#### Recurring Subscription Flow (Memberships)

```
CLIENT                          API                           RAZORPAY
  │                               │                               │
  │  1. POST /payments/           │                               │
  │     create-subscription       │                               │
  │  { planId }                   │                               │
  │──────────────────────────────►│                               │
  │                               │  2. Validate plan is          │
  │                               │     "membership" category     │
  │                               │                               │
  │                               │  3. Get Razorpay plan ID     │
  │                               │     from synced pricing       │
  │                               │                               │
  │                               │  4. Create Razorpay           │
  │                               │     Subscription              │
  │                               │──────────────────────────────►│
  │                               │  { id, status }               │
  │                               │◄──────────────────────────────│
  │                               │                               │
  │                               │  5. Save payment doc          │
  │                               │     (status: "pending")       │
  │                               │                               │
  │  { subscriptionId,            │                               │
  │    paymentId, amount, key }   │                               │
  │◄──────────────────────────────│                               │
  │                               │                               │
  │  6. Open Razorpay Checkout    │                               │
  │──────────────────────────────────────────────────────────────►│
  │                               │                               │
  │  7. User completes checkout   │                               │
  │◄──────────────────────────────────────────────────────────────│
  │                               │                               │
  │  8. POST /payments/           │                               │
  │     verify-subscription       │                               │
  │  { razorpay_subscription_id,  │                               │
  │    razorpay_payment_id,       │                               │
  │    razorpay_signature,        │                               │
  │    paymentId }                │                               │
  │──────────────────────────────►│                               │
  │                               │  9. Verify HMAC signature     │
  │                               │                               │
  │                               │  10. Run transaction:         │
  │                               │      a. Mark payment succeeded│
  │                               │      b. Set subscription      │
  │                               │      c. Set razorpay IDs      │
  │                               │      d. Calculate end date    │
  │                               │      e. Handle kickstarter    │
  │                               │         credit carry-forward  │
  │                               │                               │
  │  { success, endDate,          │                               │
  │    planId, credits }          │                               │
  │◄──────────────────────────────│                               │
  │                               │                               │
  │  ─── Recurring renewals handled by webhooks (section 6) ───   │
```

---

### 3.4 Subscriptions

| Route | Method | File | Auth | Description |
|-------|--------|------|------|-------------|
| `/api/subscriptions/activate` | POST | `src/app/api/subscriptions/activate/route.ts` | User | Mock activation (dev) |
| `/api/subscriptions/cancel` | POST | `src/app/api/subscriptions/cancel/route.ts` | User | Cancel membership renewal |
| `/api/subscriptions/update` | POST | `src/app/api/subscriptions/update/route.ts` | User | Upgrade/downgrade plan |
| `/api/subscriptions/sync` | POST | `src/app/api/subscriptions/sync/route.ts` | User | Pull state from Razorpay |
| `/api/subscriptions/portal-link` | GET | `src/app/api/subscriptions/portal-link/route.ts` | User | Get Razorpay management URL |
| `/api/subscriptions/pricing` | GET | `src/app/api/subscriptions/pricing/route.ts` | Public | Get live pricing (ISR 5min) |

#### Cancel Subscription Flow

```
1. Verify user token
2. Read user's subscription
3. Validate: must be "active" membership (not class pack)
4. If Razorpay subscription ID exists:
   a. Call Razorpay API: cancel at cycle end (not immediate)
5. If endDate > now:
   a. Set status = "active" (still usable)
   b. Set cancelAtPeriodEnd = true
   c. Set autoRenew = false
6. If endDate ≤ now:
   a. Set status = "canceled"
7. Return { success, mode: "period_end" | "immediate" }
```

#### Update (Upgrade/Downgrade) Flow

```
1. Verify user token
2. Validate target plan is "membership" category
3. Validate current subscription is active membership
4. Cannot update if renewal already canceled
5. Determine pricing:
   a. targetPrice ≥ currentPrice → scheduleChangeAt = "now" (immediate)
   b. targetPrice < currentPrice → scheduleChangeAt = "cycle_end"
6. Call Razorpay API: update subscription plan
7. If immediate:
   a. Update user subscription with new plan details
   b. Calculate credit delta (added credits = target - current)
   c. Set classesRemaining = existing + added
8. If scheduled:
   a. Set pendingPlanId, pendingRazorpayPlanId, pendingPlanEffectiveAt
9. Log change to subscriptionChanges collection
10. Return { success, mode, planId, effectiveAt, endDate }
```

---

### 3.5 Admin Routes

| Route | Method | File | Auth | Description |
|-------|--------|------|------|-------------|
| `/api/admin/set-role` | POST | `src/app/api/admin/set-role/route.ts` | Admin | Grant/revoke admin role |
| `/api/admin/trainers` | POST | `src/app/api/admin/trainers/route.ts` | Admin | Create trainer |
| `/api/admin/trainers` | PUT | `src/app/api/admin/trainers/route.ts` | Admin | Update trainer |
| `/api/admin/trainers` | DELETE | `src/app/api/admin/trainers/route.ts` | Admin | Delete trainer |
| `/api/admin/facility` | GET | `src/app/api/admin/facility/route.ts` | Any auth | Get facility |
| `/api/admin/facility` | PUT | `src/app/api/admin/facility/route.ts` | Admin | Update facility |

#### Set Admin Role Flow

```
1. Verify caller is admin
2. Validate targetUid exists
3. Call Firebase Auth: setCustomUserClaims(targetUid, { admin: isAdmin })
4. If granting:
   a. Create doc in admins collection with role = "super_admin"
5. If revoking:
   a. Delete doc from admins collection
6. Return { success: true }
```

---

### 3.6 Other Routes

| Route | Method | File | Auth | Description |
|-------|--------|------|------|-------------|
| `/api/account/delete` | POST | `src/app/api/account/delete/route.ts` | User | Delete user account |
| `/api/schedule` | GET | `src/app/api/schedule/route.ts` | User | Get schedule by date range |

#### Account Deletion Flow

```
1. Verify user token
2. If user has Razorpay subscription:
   a. Cancel it immediately (not at cycle end)
   b. If cancel fails and subscription is not cancelled/completed/not-found, abort
3. For each booking:
   a. If confirmed + upcoming: release class spot, mark canceled
   b. Anonymize: userId → "deleted-user", userName → "Deleted User"
4. For each payment: anonymize userId
5. For each introClassLead: anonymize userId, delete PII
6. Delete Firestore user document
7. Delete admin doc (if exists)
8. Delete Firebase Auth user (irreversible)
9. Return { success: true }
```

---

## 4. Firebase Cloud Functions

Located in `functions/src/`. Entry point: `functions/src/index.ts`.

### 4.1 Auth Triggers

| Function | File | Trigger | Description |
|----------|------|---------|-------------|
| `onUserCreate` | `functions/src/triggers/onUserCreate.ts` | `auth.user().onCreate` | Create user profile on signup |

**`onUserCreate` Flow:**

```
1. Firebase Auth creates new user
2. Check if email is in waitlist collection
3. If found + not archived + not claimed:
   a. Check founding_members counter < 25
   b. If under limit: mark as founding member
   c. Increment counter
   d. Mark waitlist entry as "converted"
4. Create user profile document in Firestore:
   - subscription: all nulls/expired
   - stats: zeros
   - isFoundingMember: boolean
5. Log result
```

### 4.2 Firestore Triggers

| Function | File | Trigger | Description |
|----------|------|---------|-------------|
| `onBookingStatusChange` | `functions/src/triggers/onBookingStatusChange.ts` | `bookings/{id}.onUpdate` | Update stats on attendance |
| `sendBookingConfirmation` | `functions/src/triggers/sendBookingConfirmation.ts` | `bookings/{id}.onCreate` | Generate confirmation email |

**`onBookingStatusChange` Flow:**

```
1. Booking status changes from X → "attended"
2. Read user document
3. Calculate streak:
   a. If lastAttendedDate was yesterday → streak++
   b. If lastAttendedDate was >1 day ago → streak = 1 (reset)
   c. If same day → no change
   d. If first ever → streak = 1
4. Update user stats:
   - totalClassesAttended++
   - lastAttendedDate = now
   - currentStreak = new streak
   - longestStreak = max(new streak, existing longest)
```

**`sendBookingConfirmation` Flow:**

```
1. New booking created with status = "confirmed"
2. Fetch user, class, trainer, gym details
3. Generate email HTML using template
4. Log confirmation (TODO: integrate email service)
```

### 4.3 Callable Functions (Legacy)

| Function | File | Description |
|----------|------|-------------|
| `bookClass` | `functions/src/api/bookClass.ts` | Book a class (legacy, now via API route) |
| `cancelBooking` | `functions/src/api/cancelBooking.ts` | Cancel booking (legacy) |
| `createClass` | `functions/src/api/createClass.ts` | Create class (legacy) |
| `updateClass` | `functions/src/api/updateClass.ts` | Update class (legacy) |
| `deleteClass` | `functions/src/api/deleteClass.ts` | Delete class (legacy) |
| `getScheduleByDate` | `functions/src/api/getScheduleByDate.ts` | Get schedule (legacy) |
| `getUserBookings` | `functions/src/api/getUserBookings.ts` | Get bookings (legacy) |
| `setAdminRole` | `functions/src/api/setAdminRole.ts` | Set admin role (legacy) |
| `activateSubscription` | `functions/src/api/activateSubscription.ts` | Mock activation (legacy) |
| `seedDatabase` | `functions/src/seed/seedData.ts` | Seed data for dev |

> **Note:** These callable functions are the original mobile-first backend. The web app uses Next.js API routes instead. Both systems share the same Firestore database and validation logic.

---

## 5. Scheduled / Cron Jobs

| Job | File | Schedule | Description |
|-----|------|----------|-------------|
| `expireSubscriptions` | `functions/src/scheduled/expireSubscriptions.ts` | Daily 2:15 AM IST | Expire past-due subscriptions |
| `markNoShows` | `functions/src/scheduled/markNoShows.ts` | Every 15 minutes | Mark no-shows after class ends |

**`expireSubscriptions` Flow:**

```
1. Query users where subscription.status = "active" AND endDate ≤ now
2. Process in batches of 450
3. For each user:
   a. If cancelAtPeriodEnd = true → set status = "canceled"
   b. Otherwise → set status = "expired"
   c. Set autoRenew = false
   d. Set cancelAtPeriodEnd = false
   e. Set expiredAt = server timestamp
```

**`markNoShows` Flow:**

```
1. Query bookings where status = "confirmed" AND classDate ≤ now
2. For each booking, load its class document
3. Calculate class end time: date + startTime + duration
4. If class end time ≤ now:
   a. Mark booking status → "no-show"
   b. Set noShowAt, checkedInBy = "system"
   c. Set noShowReason = "Auto-marked after class end time"
```

---

## 6. Razorpay Webhooks

**Endpoint:** `POST /api/webhooks/razorpay/route.ts`

**Webhook Secret:** `RAZORPAY_WEBHOOK_SECRET` env var

### Webhook Event Handling

| Event | Handler | Action |
|-------|---------|--------|
| `subscription.activated` | `handleSubscriptionActivated` | Activate subscription, set access window |
| `subscription.charged` | `handleSubscriptionCharged` | Reset credits on renewal, mark payment succeeded |
| `invoice.paid` | `handleSubscriptionCharged` | Same as charged |
| `subscription.updated` | `handleSubscriptionUpdated` | Handle scheduled plan changes |
| `subscription.halted` | `handleSubscriptionHalted` | Mark subscription as halted |
| `subscription.cancelled` | `handleSubscriptionCancelled` | Set cancelAtPeriodEnd if still usable |
| `subscription.completed` | `handleSubscriptionCompleted` | Disable auto-renew |
| `payment.failed` | `handlePaymentFailed` | Log to paymentFailures collection |

### Webhook Processing Flow

```
1. Verify x-razorpay-signature header
2. Check for duplicate event (razorpayWebhookEvents collection, transactional)
3. If duplicate → return { received: true, duplicate: true }
4. Register event as "processing"
5. Handle event based on type
6. Mark event as "processed" or "failed"
7. Return { received: true }
```

### `applySubscriptionAccess` (Core Renewal Logic)

```
Called by: subscription.activated, subscription.charged, subscription.updated

1. Find user by razorpaySubscriptionId (try users → then payments collection)
2. Get plan from Razorpay plan ID (via getPlanIdForRazorpayPlanId)
3. Mark payment as succeeded (if payment ID provided)
4. Calculate access window from Razorpay subscription dates
5. In transaction:
   a. Read fresh user document
   b. Preserve introCreditRemaining
   c. Handle kickstarter credit carry-forward
   d. Determine if renewal was canceled (cancelAtPeriodEnd)
   e. Update all subscription fields:
      - planId, planCategory, startDate, endDate, status
      - classesRemaining (reset on renewal, preserved on mid-cycle update)
      - autoRenew, cancelAtPeriodEnd
      - razorpaySubscriptionId, razorpayPlanId
      - pendingPlan* fields (clear if no scheduled changes)
      - lastSyncedAt
```

---

## 7. Shared Backend Utilities

Located in `shared/src/`.

### 7.1 Payment Processors

| File | Description |
|------|-------------|
| `shared/src/payments/razorpay-processor.ts` | Razorpay API wrapper |
| `shared/src/payments/mock-processor.ts` | Mock processor for dev/testing |

**Razorpay Processor Functions:**

| Function | Description |
|----------|-------------|
| `createRazorpayOrder(amount, planId, keyId, keySecret)` | Create one-time payment order |
| `verifyPaymentSignature(orderId, paymentId, signature, secret)` | Verify HMAC signature |
| `createRazorpaySubscription(planId, totalCount, keyId, keySecret, metadata)` | Create recurring subscription |
| `fetchRazorpaySubscription(subscriptionId, keyId, keySecret)` | Fetch subscription details |
| `updateRazorpaySubscription(subscriptionId, planId, keyId, keySecret, options)` | Update subscription plan |
| `cancelRazorpaySubscription(subscriptionId, keyId, keySecret, atCycleEnd)` | Cancel subscription |
| `verifyWebhookSignature(body, signature, secret)` | Verify webhook HMAC |

### 7.2 Firestore Helpers

| File | Key Functions |
|------|---------------|
| `shared/src/firebase/firestore.ts` | All Firestore queries and API wrappers |

**Client-Side Firestore Functions (used by web + mobile):**

| Function | Description |
|----------|-------------|
| `apiFetch(url, options)` | Authenticated fetch to Next.js API routes |
| `getClassesByDate(date)` | Query classes for a given date |
| `getAdminClassesInRange(start, end)` | All classes in date range (admin) |
| `getClassById(classId)` | Single class document |
| `getUserBookings(userId)` | User's bookings |
| `getUserBookingsPage(userId, options)` | Paginated user bookings with enrichment |
| `getUserProfile(uid)` | User profile |
| `subscribeToUserProfile(uid, callback)` | Real-time user profile listener |
| `getTrainers()` | All active trainers |
| `subscribeToClass(classId, callback)` | Real-time class listener |
| `subscribeToClassesByDate(date, callback, options)` | Real-time classes by date |
| `subscribeToUserBookings(userId, callback)` | Real-time user bookings |
| `getAllClasses()` | All classes (admin) |
| `getClassesPage(options)` | Paginated classes |
| `getClassStats()` | Class aggregate stats |
| `getAllBookings()` | All bookings (admin) |
| `getBookingsPage(options)` | Paginated bookings |
| `getAllMembers()` | All users (admin) |
| `getMembersPage(options)` | Paginated members |
| `getAllTrainers()` | All trainers (admin) |
| `getTrainersPage(options)` | Paginated trainers |
| `getFacility()` | Single gym center |
| `getBookingStats()` | Booking aggregate stats |
| `getMembershipDistribution()` | Membership pie chart data |
| `getClassPopularity()` | Class popularity bar chart data |
| `getLocationUtilization()` | Location utilization data |
| `getAttendanceStats()` | Attendance aggregate stats |
| `callBookClass(...)` | → `POST /api/bookings/book` |
| `callCancelBooking(...)` | → `POST /api/bookings/cancel` |
| `callDeleteAccount()` | → `POST /api/account/delete` |
| `callCreateClass(...)` | → `POST /api/classes` |
| `callUpdateClass(...)` | → `PUT /api/classes` |
| `callDeleteClass(...)` | → `DELETE /api/classes` |
| `callSetAdminRole(...)` | → `POST /api/admin/set-role` |
| `callActivateSubscription(...)` | → `POST /api/subscriptions/activate` |
| `callCreatePaymentIntent(...)` | → `POST /api/payments/create-intent` |
| `callConfirmPayment(...)` | → `POST /api/payments/confirm` |
| `callCreatePaymentOrder(...)` | → `POST /api/payments/create-order` |
| `callVerifyPayment(...)` | → `POST /api/payments/verify` |
| `callCreateRazorpaySubscription(...)` | → `POST /api/payments/create-subscription` |
| `callVerifyRazorpaySubscription(...)` | → `POST /api/payments/verify-subscription` |
| `callAbandonRazorpaySubscription(...)` | → `POST /api/payments/abandon-subscription` |
| `callUpdateRazorpaySubscription(...)` | → `POST /api/subscriptions/update` |
| `callSyncRazorpaySubscription()` | → `POST /api/subscriptions/sync` |
| `callCancelSubscription()` | → `POST /api/subscriptions/cancel` |
| `callGetSubscriptionPortalLink()` | → `GET /api/subscriptions/portal-link` |
| `callGetPricing()` | → `GET /api/subscriptions/pricing` |
| `callCreateTrainer(...)` | → `POST /api/admin/trainers` |
| `callUpdateTrainer(...)` | → `PUT /api/admin/trainers` |
| `callDeleteTrainer(...)` | → `DELETE /api/admin/trainers` |
| `callUpdateFacility(...)` | → `PUT /api/admin/facility` |
| `callCheckInBooking(...)` | → `POST /api/bookings/checkin` |

### 7.3 Subscription Plans

| File | Description |
|------|-------------|
| `shared/src/types/subscription.ts` | Plan catalog, IDs, pricing |

**Plan Catalog (`PLAN_CATALOG`):**

| Plan ID | Name | Category | Price (INR) | Credits | Duration | Weekly Limit | Auto-Renew |
|---------|------|----------|-------------|---------|----------|-------------|------------|
| `drop_in` | Intro Class | class_pack | ₹1,000 | 1 intro | 30 days | 1 | No |
| `kickstarter` | Sol Kickstarter | class_pack | ₹5,000 | 4 | 14 days | 2 | No |
| `twice_quarterly` | 2x Weekly · Quarterly | membership | ₹36,000 | 24 | 90 days | 2 | Yes |
| `twice_6mo` | 2x Weekly · 6 Months | membership | ₹64,000 | 48 | 180 days | 2 | Yes |
| `thrice_quarterly` | 3x Weekly · Quarterly | membership | ₹54,000 | 36 | 90 days | 3 | Yes |
| `thrice_6mo` | 3x Weekly · 6 Months | membership | ₹96,000 | 72 | 180 days | 3 | Yes |

**Legacy plan ID mapping** (backward compatibility):

| Legacy ID | Maps To |
|-----------|----------|
| `weekly` | `twice_quarterly` |
| `monthly` | `twice_quarterly` |
| `quarterly` | `twice_quarterly` |
| `unlimited` | `thrice_6mo` |
| `twice_weekly` | `twice_quarterly` |
| `once_weekly` | `kickstarter` |
| `five_pack` | `twice_quarterly` |
| `ten_pack` | `twice_6mo` |

### 7.4 Pricing Sync

| File | Description |
|------|-------------|
| `src/lib/razorpay/pricing.ts` | Server-side pricing sync from Razorpay |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `getSyncedPricing()` | Get all plans with live Razorpay prices |
| `getSyncedPlanEntry(planId)` | Get single plan with synced price |
| `getChargeAmount(plan, syncedPlan, isFoundingMember)` | Calculate final charge amount |
| `getPlanIdForRazorpayPlanId(razorpayPlanId)` | Reverse-map Razorpay plan to app plan |

---

## 8. Authentication & Authorization Flow

### Client Authentication

```
1. User signs up / logs in via Firebase Auth SDK
2. Firebase returns ID token
3. Client stores token (Firebase handles persistence)
4. All API calls include: Authorization: Bearer <idToken>
5. Client reads profile from Zustand store (clientAuthStore)
6. Store subscribes to Firestore user document (real-time)
```

### Server Authentication

```
1. API route receives request
2. Extract Bearer token from Authorization header
3. Call adminAuth.verifyIdToken(token) → decoded claims
4. Check decoded.uid for user identification
5. Check decoded.admin for admin authorization
6. If admin required and !decoded.admin → 403
```

### Admin Role Management

```
1. Admin role stored as Firebase Auth custom claim: { admin: true }
2. Custom claims propagate to ID token (may take up to 1 hour)
3. Admin doc also stored in admins collection for reference
4. To grant: POST /api/admin/set-role (requires existing admin)
5. To bootstrap first admin: use scripts/grant-admin.mjs
```

### Firebase Admin SDK Initialization (`src/lib/firebase/admin.ts`)

```typescript
// Fix escaped newlines in private key (common in .env files)
if (serviceAccount?.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}
```

> **⚠️ Gotcha:** The `FIREBASE_SERVICE_ACCOUNT` env var in `.env.local` stores the private key with literal `\n` characters (not real newlines). The `replace(/\\n/g, '\n')` line is critical — without it, API routes return HTML error pages with "Failed to parse private key: Invalid PEM formatted message". If you see this error, verify `admin.ts` has the replace line.

---

## 9. Data Flow Diagrams

### 9.1 Complete Booking Flow (Web)

```
User clicks class on schedule page
    │
    ▼
SchedulePage.handleBook()
    │
    ├─ Check subscription validity (client-side)
    │   ├─ No active subscription → show SubscriptionPromptModal
    │   ├─ Subscription expired → toast error
    │   ├─ Intro plan + non-intro class → toast error
    │   ├─ No credits left → toast error
    │   └─ Date after subscription end → toast error
    │
    ▼
SpotSelectionModal opens
    │
    ▼
User selects spot, clicks Confirm
    │
    ▼
callBookClass(classId, spotNumber, isGuest)
    │
    ▼
apiFetch('/api/bookings/book', { POST, body })
    │
    ├─ Firebase Auth adds Bearer token
    │
    ▼
POST /api/bookings/book
    │
    ├─ Verify token → userId
    ├─ Firestore transaction:
    │   ├─ Validate class (status, date, capacity, spot)
    │   ├─ Validate subscription (active, not expired, credits)
    │   ├─ Validate limits (daily, weekly, duplicate)
    │   ├─ Create booking document
    │   ├─ Update class (bookedCount++, bookedSpots.push)
    │   └─ Decrement user credit
    │
    ▼
Response: { success: true, bookingId }
    │
    ▼
UI updates:
    ├─ Toast: "Booking confirmed!"
    ├─ Spot count auto-updates (real-time Firestore subscription)
    └─ User credits refresh
```

### 9.2 Subscription Purchase Flow (Web)

```
User clicks "Buy" on plan card
    │
    ▼
SubscribePage handles purchase
    │
    ├─ Membership plan → callCreateRazorpaySubscription(planId)
    │   → POST /api/payments/create-subscription
    │   → Razorpay creates subscription
    │   → Returns subscriptionId, key
    │
    ├─ Class pack / Intro → callCreatePaymentOrder(planId)
    │   → POST /api/payments/create-order
    │   → Razorpay creates order
    │   → Returns orderId, key
    │
    ▼
Razorpay Checkout Modal opens
    │
    ▼
User completes payment
    │
    ├─ Membership → callVerifyRazorpaySubscription(payload)
    │   → POST /api/payments/verify-subscription
    │   → Verifies signature, activates subscription
    │
    ├─ Class pack → callVerifyPayment(payload)
    │   → POST /api/payments/verify
    │   → Verifies signature, activates subscription
    │
    ▼
User subscription updated in Firestore
    │
    ├─ Dashboard reflects new plan/credits
    └─ Schedule page allows booking
```

### 9.3 Recurring Renewal Flow

```
Razorpay charges subscription on renewal date
    │
    ▼
Razorpay sends webhook: subscription.charged / invoice.paid
    │
    ▼
POST /api/webhooks/razorpay
    │
    ├─ Verify webhook signature
    ├─ Deduplicate (razorpayWebhookEvents)
    ├─ handleSubscriptionCharged()
    │   ├─ Find user by razorpaySubscriptionId
    │   ├─ Get plan from Razorpay plan ID
    │   ├─ Mark payment as succeeded
    │   └─ applySubscriptionAccess()
    │       ├─ Reset classesRemaining to plan.credits
    │       ├─ Update endDate from Razorpay dates
    │       ├─ Handle kickstarter credit carry-forward
    │       └─ Set autoRenew based on cancel_at_cycle_end
    │
    ▼
User's subscription refreshed on next page load
```

---

*Last updated: June 2026*
*Generated by comprehensive codebase analysis.*
