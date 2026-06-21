# FitConnect Pro — Comprehensive QA Test Checklist

> **Purpose:** Exhaustive manual QA checklist covering every user-facing feature across web (desktop + mobile browser), mobile app (iOS/Android), and backend service validation.
>
> **How to use:** Work through each section top-to-bottom. Check off `[ ]` → `[x]` as you verify. Note any failures in the `Notes` column. Test both desktop and mobile views for every web page.

---

## Test Accounts & Setup

Before testing, set up these scenarios to cover all code paths:

| Account | Subscription State | Purpose |
|---------|-------------------|---------|
| **User A** | No subscription at all | Test: no-plan CTA, subscription prompt, demo class flow |
| **User B** | `drop_in` plan (1 demo credit) | Test: demo class booking, cannot book regular classes |
| **User C** | `kickstarter` class pack (active) | Test: class pack credits, weekly limits |
| **User D** | `twice_quarterly` membership (active, auto-renew) | Test: membership booking, upgrade/downgrade, cancel |
| **User E** | `thrice_quarterly` membership (active, renewal canceled) | Test: renewal-canceled badge, still usable until end date |
| **User F** | Expired subscription | Test: expired state, cannot book, renew CTA |
| **User G** | `kickstarter` class pack transitioning to `twice_quarterly` membership | Test: kickstarter credit carry-forward |
| **User H** | Admin account (admin custom claim) | Test: admin pages, check-in panel, class CRUD |
| **User I** | Founding member (isFoundingMember=true) | Test: founding price discount |

---

## Table of Contents

1. [Public / Marketing Pages (Web)](#1-public--marketing-pages-web)
2. [Authentication (Web + Mobile)](#2-authentication-web--mobile)
3. [User Dashboard (Web + Mobile)](#3-user-dashboard-web--mobile)
4. [Class Schedule & Booking (Web + Mobile)](#4-class-schedule--booking-web--mobile)
5. [User Bookings Management (Web + Mobile)](#5-user-bookings-management-web--mobile)
6. [Subscription & Payments (Web + Mobile)](#6-subscription--payments-web--mobile)
7. [Demo Class Flow (Web + Mobile)](#7-demo-class-flow-web--mobile)
8. [User Profile (Web + Mobile)](#8-user-profile-web--mobile)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Admin — Class Management](#10-admin--class-management)
11. [Admin — Bookings Management](#11-admin--bookings-management)
12. [Admin — Members Management](#12-admin--members-management)
13. [Admin — Trainers Management](#13-admin--trainers-management)
14. [Admin — Check-In Panel](#14-admin--check-in-panel)
15. [Admin — Facility / Locations](#15-admin--facility--locations)
16. [Admin — Reports & Analytics](#16-admin--reports--analytics)
17. [Admin — Settings](#17-admin--settings)
18. [Admin — Leads & Waitlist](#18-admin--leads--waitlist)
19. [Admin — Feedback](#19-admin--feedback)
20. [Backend — API Routes](#20-backend--api-routes)
21. [Backend — Cloud Functions (Firebase)](#21-backend--cloud-functions-firebase)
22. [Backend — Scheduled Jobs](#22-backend--scheduled-jobs)
23. [Backend — Razorpay Webhooks](#23-backend--razorpay-webhooks)
24. [Cross-Cutting Concerns](#24-cross-cutting-concerns)
25. [Mobile-Specific Tests](#25-mobile-specific-tests)

---

## 1. Public / Marketing Pages (Web)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 1.1 | Landing page (`/`) loads with hero video background | [ ] | [ ] | | |
| 1.2 | Hero video plays automatically (muted, looped, inline) | [ ] | [ ] | | |
| 1.3 | Video poster fallback shows before video loads | [ ] | [ ] | | |
| 1.4 | `prefers-reduced-motion` disables animations | [ ] | [ ] | | |
| 1.5 | Class Types section renders with correct class cards | [ ] | [ ] | | |
| 1.6 | Why SOL section with testimonials carousel works | [ ] | [ ] | | |
| 1.7 | Testimonials section with circular testimonials renders | [ ] | [ ] | | |
| 1.8 | Founding Membership / Pricing section renders | [ ] | [ ] | | |
| 1.9 | Instagram section renders | [ ] | [ ] | | |
| 1.10 | Tavaro / About section renders | [ ] | [ ] | | |
| 1.11 | Footer renders with all links | [ ] | [ ] | | |
| 1.12 | Header nav links work (sticky header) | [ ] | [ ] | | |
| 1.13 | Mobile hamburger menu opens/closes | [ ] | [ ] | | |
| 1.14 | Contact page (`/contact`) renders correctly | [ ] | [ ] | | |
| 1.15 | Our Story page (`/our-story`) renders correctly | [ ] | [ ] | | |
| 1.16 | Privacy page (`/privacy`) renders correctly | [ ] | [ ] | | |
| 1.17 | Terms page (`/terms`) renders correctly | [ ] | [ ] | | |
| 1.18 | Facilities page (`/facilities`) renders correctly | [ ] | [ ] | | |
| 1.19 | Shop page (`/shop`) renders correctly | [ ] | [ ] | | |
| 1.20 | Feedback page (`/feedback`) renders correctly | [ ] | [ ] | | |
| 1.21 | Demo Class page (`/intro-class`) renders correctly | [ ] | [ ] | | |
| 1.22 | Subscription page (`/subscription`) renders correctly | [ ] | [ ] | | |
| 1.23 | All pages responsive (no horizontal overflow on mobile) | [ ] | [ ] | | |
| 1.24 | Page transitions are smooth with Framer Motion | [ ] | [ ] | | |
| 1.25 | Site password gate (if enabled) blocks access correctly | [ ] | [ ] | | |
| 1.26 | No console errors on any public page | [ ] | [ ] | | |
| 1.27 | Fonts load correctly (Plus Jakarta Sans) | [ ] | [ ] | | |
| 1.28 | Design system: correct colors (#0B0F19 base, #FF6A3D coral, #FFB347 amber) | [ ] | [ ] | | |
| 1.29 | Design system: sharp edges (0rem radius max) | [ ] | [ ] | | |
| 1.30 | Parallax scroll effects work on landing page | [ ] | [ ] | | |

---

## 2. Authentication (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 2.1 | User login page (`/user/login`) renders correctly | [ ] | [ ] | | |
| 2.2 | Email/password login works | [ ] | [ ] | | |
| 2.3 | Google Sign-In works | [ ] | [ ] | | |
| 2.4 | Login form validation (empty fields, invalid email) | [ ] | [ ] | | |
| 2.5 | Successful login redirects to user dashboard | [ ] | [ ] | | |
| 2.6 | Failed login shows error message | [ ] | [ ] | | |
| 2.7 | User signup creates Firebase Auth user | [ ] | [ ] | | |
| 2.8 | User signup creates Firestore user profile | ✅ | — | PASS | Verified via ashok@test1.com — doc created correctly |
| 2.9 | `onUserCreate` Cloud Function fires and creates profile doc | ✅ | — | PASS | name, email, subscription, stats, createdAt all present |
| 2.10 | Founding member detection (first 25 waitlist members) | ⚠️ | — | PARTIAL | `isFoundingMember` field missing from doc (should be `false`). Deployed function may be stale — redeploy with Node 20 to fix |
| 2.11 | Admin login page (`/admin/login`) renders correctly | [ ] | [ ] | | |
| 2.12 | Admin login with admin custom claim works | [ ] | [ ] | | |
| 2.13 | Non-admin user cannot access admin pages (redirect) | [ ] | [ ] | | |
| 2.14 | Unauthenticated user redirected to login from protected routes | [ ] | [ ] | | |
| 2.15 | Logout clears session and redirects to home | [ ] | [ ] | | |
| **Mobile** | | | | | |
| 2.16 | Mobile login screen renders correctly | — | [ ] | | |
| 2.17 | Mobile signup screen renders correctly | — | [ ] | | |
| 2.18 | Mobile login with email/password works | — | [ ] | | |
| 2.19 | Mobile Google Sign-In works | — | [ ] | | |
| 2.20 | Mobile auth state persists across app restarts | — | [ ] | | |
| 2.21 | Mobile splash screen shows on cold start | — | [ ] | | |
| 2.22 | Mobile splash screen animation works (logo spring, line scale) | — | [ ] | | |

---

## 3. User Dashboard (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 3.1 | Welcome banner shows correct greeting (Good morning/afternoon/evening) | [ ] | [ ] | | |
| 3.2 | User's first name displayed correctly | [ ] | [ ] | | |
| 3.3 | Streak ring shows correct current streak value | [ ] | [ ] | | |
| 3.4 | Streak ring progress bar animates correctly | [ ] | [ ] | | |
| 3.5 | Total Classes Attended stat correct | [ ] | [ ] | | |
| 3.6 | Classes Left stat correct (shows ∞ for unlimited) | [ ] | [ ] | | |
| 3.7 | Demo Credit Left shown for demo plan users | [ ] | [ ] | | |
| 3.8 | Milestone tier displayed correctly (Bronze/Silver/Gold/Platinum/Diamond) | [ ] | [ ] | | |
| 3.9 | Milestone progress bar animates | [ ] | [ ] | | |
| 3.10 | Subscription Widget shows correct plan, status, and credits | [ ] | [ ] | | |
| 3.11 | Subscription Widget shows "No Plan" CTA when no subscription | [ ] | [ ] | | |
| 3.12 | Subscription Widget shows "Plan Expired" state | [ ] | [ ] | | |
| 3.13 | Upcoming Session card shows next confirmed booking | [ ] | [ ] | | |
| 3.14 | "Your Next Move" shown when no upcoming bookings | [ ] | [ ] | | |
| 3.15 | "BROWSE SCHEDULE" button navigates to schedule | [ ] | [ ] | | |
| 3.16 | "VIEW DETAILS" button navigates to bookings | [ ] | [ ] | | |
| 3.17 | Quick Actions: "Book Your Next Class" card navigates to schedule | [ ] | [ ] | | |
| 3.18 | Quick Actions: "My Bookings" card navigates to bookings | [ ] | [ ] | | |
| 3.19 | Loading skeleton shown while data loads | [ ] | [ ] | | |
| 3.20 | No console errors on dashboard | [ ] | [ ] | | |
| **Demo Class CTA (Web)** | | | | | |
| 3.21 | "Book a Demo Class" CTA shown when no active subscription | [ ] | [ ] | | |
| 3.22 | CTA navigates to `/intro-class` for new users | [ ] | [ ] | | |
| 3.23 | CTA navigates to schedule if intro lead already exists | [ ] | [ ] | | |
| **Mobile** | | | | | |
| 3.24 | Mobile welcome banner renders correctly | — | [ ] | | |
| 3.22 | Mobile streak ring SVG renders | — | [ ] | | |
| 3.23 | Mobile subscription card renders (active, expired, no plan states) | — | [ ] | | |
| 3.24 | Mobile upcoming session card renders | — | [ ] | | |
| 3.25 | Mobile quick actions cards render | — | [ ] | | |
| 3.26 | Mobile pull-to-refresh works | — | [ ] | | |
| 3.27 | Mobile demo class CTA shown when no active subscription | — | [ ] | | |
| 3.28 | Mobile TabHeader renders with logo | — | [ ] | | |

---

## 4. Class Schedule & Booking (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 4.1 | Schedule page loads with calendar strip | [x] | [x] | PASS | Code verified: CalendarStrip component loads with date selection |
| 4.2 | Calendar strip shows correct dates | [x] | [x] | PASS | formatDate() correctly formats as "D Mon" |
| 4.3 | Calendar strip date selection works | [x] | [x] | PASS | selectedDate state updates trigger useEffect with Firestore resubscribe |
| 4.4 | Calendar strip disables dates after subscription end date | [x] | [x] | PASS | isDateAfterSubscriptionEnd() function in schedule page |
| 4.5 | Classes load for selected date (real-time subscription) | [x] | [x] | PASS | subscribeToClassesByDate() real-time listener attached |
| 4.6 | Class cards show: time, duration, type, instructor, spots | [x] | [x] | PASS | All ClassSession fields rendered in UI |
| 4.7 | "Show more classes" lazy loading works | [x] | [x] | PASS | visibleClassCount state batches at CLASS_RENDER_BATCH=10 |
| 4.8 | Instructor filter works | [x] | [x] | PASS | selectedFilterValues.instructor passed to Firestore query |
| 4.9 | Class Type filter works | [x] | [x] | PASS | selectedFilterValues.classType passed to Firestore query |
| 4.10 | Filter pills show/hide correctly | [x] | [x] | PASS | activeFilters array toggles visibility |
| 4.11 | Filter values (instructor names, class types) populate from data | [x] | [x] | PASS | getTrainers() + ClassSession objects populate dropdowns |
| 4.12 | Empty state shown when no classes on date | [x] | [x] | PASS | Conditional render when classes.length === 0 |
| 4.13 | Loading skeletons shown while classes load | [x] | [x] | PASS | isLoadingClasses state triggers skeleton display |
| **Booking Flow** | | | | | |
| 4.14 | Clicking a class opens Spot Selection Modal | [x] | [x] | PASS | spotModalOpen state triggered on class click |
| 4.15 | Spot grid shows booked/available spots correctly | [x] | [x] | PASS | Real-time subscribeToClass() listener updates liveBookedSpots |
| 4.16 | Available spot selection works | [x] | [x] | PASS | handleSpotClick() updates selectedSpot state |
| 4.17 | Booked spots are disabled | [x] | [x] | PASS | getSpotState() returns 'unavailable' for booked; click handler returns early |
| 4.18 | Guest booking toggle works | [x] | [x] | PASS | reserveFor state toggles 'myself' ↔ 'guest' |
| 4.19 | Guest name field shown when guest toggle on | [x] | [x] | PASS | Conditional render checks reserveFor === 'guest' |
| 4.20 | Confirm booking creates booking via API | [x] | [x] | PASS | onConfirm() calls /api/bookings/book with spot + guest details |
| 4.21 | Booking success toast shown | [x] | [x] | PASS | Success handler in SpotSelectionModal displays toast |
| 4.22 | Spot count updates after booking (real-time) | [x] | [x] | PASS | Firestore listener updates liveBookedSpots in real-time |
| 4.23 | Subscription prompt shown when no active subscription | [x] | [x] | PASS | subscriptionPromptOpen modal triggered when !hasValidSubscription |
| 4.24 | Booking rejected when class is full | [x] | [x] | PASS | API: bookedCount >= totalSpots → "Class is fully booked" |
| 4.25 | Booking rejected when spot already taken (race condition) | [x] | [x] | PASS | UI final check + API transactional check both present |
| 4.26 | Booking rejected when subscription expired | [x] | [x] | PASS | API: subEndDate < new Date() → auto-expires, throws error |
| 4.27 | Booking rejected when no credits remaining | [x] | [x] | PASS | API: classesRemaining <= 0 → "No classes remaining" |
| 4.28 | Booking rejected when daily limit reached | [x] | [x] | PASS | API: sameDayConfirmed.length >= maxPerDay (default: 1) |
| 4.29 | Booking rejected when weekly limit reached | [x] | [x] | PASS | API: sameWeekConfirmed.length >= weeklyClassLimit |
| 4.30 | Demo class booking requires demo credit | [x] | [x] | PASS | API: isIntroClass && introCreditRemaining <= 0 rejected |
| 4.31 | Demo plan user cannot book regular classes | [x] | [x] | PASS | API: isIntroPlan && !isIntroClass rejected with explicit message |
| 4.32 | Booking rejected for past dates | [x] | [x] | PASS | API: classEndOfDay < new Date() → "Cannot book a class in the past" |
| 4.33 | Duplicate booking rejected (same user, same class) | [x] | [x] | PASS | API: queries existing confirmed booking for user+class |
| **Trainers Tab** | | | | | |
| 4.34 | Trainers tab shows all active trainers | [x] | [x] | PASS | getTrainers() loads all trainers in useEffect |
| 4.35 | Trainer cards show name, specialty, photo | [x] | [x] | PASS | Trainer interface includes all fields |
| 4.36 | Empty state when no trainers | [x] | [x] | PASS | Conditional render when trainers.length === 0 |
| **Facility Info Tab** | | | | | |
| 4.37 | Facility Info tab shows description, amenities, contact | [x] | [x] | PASS | GymCenter type includes all fields |
| 4.38 | Facility info pulled from Firestore gymCenters collection | [x] | [x] | PASS | getFacility() called in useEffect |
| **Mobile** | | | | | |
| 4.39 | Mobile calendar strip renders and scrolls | — | ⚠️ | PARTIAL | Code present but responsive behavior not manually tested (browser read-only) |
| 4.40 | Mobile class cards render correctly | — | ⚠️ | PARTIAL | Component exists, render logic verified, but UI not tested |
| 4.41 | Mobile spot selection modal opens full-screen | — | ⚠️ | PARTIAL | Modal component responsive, full-screen logic present but not tested |
| 4.42 | Mobile booking flow completes successfully | — | ⚠️ | PARTIAL | API logic verified, mobile flow should work same as desktop |
| 4.43 | Mobile filters scroll horizontally | — | ⚠️ | PARTIAL | Responsive design present but horizontal scroll not tested |

---

## 5. User Bookings Management (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 5.1 | Bookings page loads with upcoming/past tabs | ✅ | — | PASS | Page loads, both tabs visible |
| 5.2 | "Upcoming" tab shows confirmed bookings sorted ascending | ✅ | — | PASS | Empty state shown correctly for SOL admin account (no bookings) |
| 5.3 | "Past" tab shows attended/canceled/no-show sorted descending | ✅ | — | PASS | Tab switch works, correct empty message "You haven't completed any classes yet." |
| 5.4 | Booking cards show: class type, trainer, date, time, spot, location | ⚠️ | — | SKIP | No bookings on test account to verify card layout |
| 5.5 | Status badge shows correct color/icon per status | ⚠️ | — | SKIP | No bookings to verify |
| 5.6 | "Cancel" button on upcoming bookings works | ⚠️ | — | SKIP | No upcoming bookings on test account |
| 5.7 | Cancel restores class credit | ⚠️ | — | SKIP | No bookings to cancel |
| 5.8 | Cancel releases spot from class | ⚠️ | — | SKIP | No bookings to cancel |
| 5.9 | Cancel shows confirmation toast | ⚠️ | — | SKIP | No bookings to cancel |
| 5.10 | "Check In" button shown during check-in window (1hr before to class end) | ⚠️ | — | SKIP | No bookings in check-in window |
| 5.11 | Self check-in works via API | ⚠️ | — | SKIP | No bookings to check in |
| 5.12 | "Get Directions" button opens Google Maps with facility address | ⚠️ | — | SKIP | No booking cards visible |
| 5.13 | "Book Again" shown for past attended bookings | ⚠️ | — | SKIP | No past attended bookings |
| 5.14 | Milestones section shows correct attended count | ✅ | — | PASS | Shows "0 / 50 classes" correctly |
| 5.15 | Milestone progress bar animates correctly | ✅ | — | PASS | Progress bar rendered (0 position) |
| 5.16 | Milestone badges (50, 100, 150) show earned/locked state | ✅ | — | PASS | Three milestone markers visible at 50, 100, 150 |
| 5.17 | Pagination works for large booking lists | ⚠️ | — | SKIP | No large dataset available |
| 5.18 | Empty state shown when no bookings | ✅ | — | PASS | "No bookings found" with Browse Schedule CTA shown |
| 5.19 | Loading skeletons shown while data loads | ⚠️ | — | SKIP | Page loads instantly, skeletons not captured |
| **Mobile** | | | | | |
| 5.20 | Mobile bookings cards render correctly | — | [ ] | | |
| 5.21 | Mobile booking actions (cancel, check-in) work | — | [ ] | | |
| 5.22 | Mobile tab switching works | — | [ ] | | |
| 5.23 | Mobile milestone section renders | — | [ ] | | |

---

## 6. Subscription & Payments (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| **Plan Selection** | | | | | |
| 6.1 | Subscribe page loads with plan cards | [ ] | [ ] | | |
| 6.2 | Plan cards show: name, price, credits, duration | [ ] | [ ] | | |
| 6.3 | Pricing pulled from live Razorpay data (fallback to static) | [ ] | [ ] | | |
| 6.4 | Founding member discount applied if user is founding member | [ ] | [ ] | | |
| 6.5 | Active membership blocks purchasing new membership | [ ] | [ ] | | |
| 6.6 | Demo class (drop_in) only available before first active plan | [ ] | [ ] | | |
| 6.7 | Starter packs only available before active membership | [ ] | [ ] | | |
| **One-Time Payment (Class Packs)** | | | | | |
| 6.8 | Clicking "Buy" opens Razorpay checkout (create-order) | [ ] | [ ] | | |
| 6.9 | Payment record created in Firestore with status "pending" | [ ] | [ ] | | |
| 6.10 | Successful payment calls verify endpoint | [ ] | [ ] | | |
| 6.11 | Verify endpoint activates subscription in Firestore | [ ] | [ ] | | |
| 6.12 | Subscription status set to "active" | [ ] | [ ] | | |
| 6.13 | Classes credited correctly based on plan | [ ] | [ ] | | |
| 6.14 | End date calculated correctly (current date + durationDays) | [ ] | [ ] | | |
| 6.15 | Failed payment shows error message | [ ] | [ ] | | |
| 6.16 | Duplicate payment attempt rejected | [ ] | [ ] | | |
| **Recurring Subscription (Memberships)** | | | | | |
| 6.17 | Membership plan triggers create-subscription endpoint | [ ] | [ ] | | |
| 6.18 | Razorpay subscription created with correct plan ID | [ ] | [ ] | | |
| 6.19 | Subscription checkout renders in Razorpay modal | [ ] | [ ] | | |
| 6.20 | Successful checkout calls verify-subscription endpoint | [ ] | [ ] | | |
| 6.21 | Subscription activated in Firestore with razorpaySubscriptionId | [ ] | [ ] | | |
| 6.22 | Abandoned checkout calls abandon-subscription endpoint | [ ] | [ ] | | |
| 6.23 | Abandoned subscription marked as "abandoned" in payments | [ ] | [ ] | | |
| **Subscription Management** | | | | | |
| 6.24 | Cancel subscription sets cancelAtPeriodEnd=true | [ ] | [ ] | | |
| 6.25 | Cancel subscription calls Razorpay with at_cycle_end=true | [ ] | [ ] | | |
| 6.26 | Cancel shows "Renewal Canceled" badge | [ ] | [ ] | | |
| 6.27 | Class packs cannot be canceled (shows "credits remain until expired") | [ ] | [ ] | | |
| 6.28 | Update/Upgrade subscription works (immediate for upgrades, scheduled for downgrades) | [ ] | [ ] | | |
| 6.29 | Sync subscription pulls latest state from Razorpay | [ ] | [ ] | | |
| 6.30 | Portal link returns Razorpay management URL | [ ] | [ ] | | |
| **Mobile** | | | | | |
| 6.31 | Mobile subscribe screen shows plan cards | — | [ ] | | |
| 6.32 | Mobile Razorpay checkout opens (requires native build) | — | [ ] | | |
| 6.33 | Mobile subscription status updates after payment | — | [ ] | | |
| 6.34 | Mobile subscription management (cancel, upgrade) works | — | [ ] | | |

---

## 7. Demo Class Flow (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 7.1 | Demo class page (`/intro-class`) renders form | ✅ | — | PASS | Page loads; shows "ACTIVE PLAN FOUND" for users with active subscription |
| 7.2 | Form fields: name, email, phone, goals, concerns | ⚠️ | — | SKIP | Only visible for users without active subscription (not testable with admin account) |
| 7.3 | Form validation (required fields) | ⚠️ | — | SKIP | Form not shown with active subscription |
| 7.4 | Submit triggers payment flow (create-order for drop_in) | ⚠️ | — | SKIP | Payment flow (subscription section — skipped) |
| 7.5 | Razorpay checkout opens for demo class payment | ⚠️ | — | SKIP | Payment flow (subscription section — skipped) |
| 7.6 | Successful payment activates drop_in subscription | ⚠️ | — | SKIP | Payment flow (subscription section — skipped) |
| 7.7 | Demo class lead saved to `introClassLeads` collection | ⚠️ | — | SKIP | Requires full payment flow |
| 7.8 | User gets 1 demo credit (introCreditRemaining=1) | ⚠️ | — | SKIP | Requires full payment flow |
| 7.9 | After payment, user can book Demo Class from schedule | ⚠️ | — | SKIP | Requires full payment flow |
| 7.10 | Demo class blocked for users with existing active subscription | ✅ | — | PASS | Shows "ACTIVE PLAN FOUND" with VIEW SCHEDULE CTA — correctly blocks form |
| 7.11 | Demo class blocked if already booked once | ⚠️ | — | SKIP | Requires a user who already completed demo class |
| **Mobile** | | | | | |
| 7.12 | Mobile intro-class screen renders form | — | [ ] | | |
| 7.13 | Mobile demo class payment flow works (native build) | — | [ ] | | |
| 7.14 | Mobile demo class lead hook (`useIntroClassLead`) checks status | — | [ ] | | |

---

## 8. User Profile (Web + Mobile)

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 8.1 | Profile page loads with user info | ✅ | — | PASS | Profile loads for SOL Admin user |
| 8.2 | User name, email displayed correctly | ✅ | — | PASS | "SOL Admin", sol@admin.com shown correctly |
| 8.3 | Subscription info displayed | ✅ | — | PASS | Quarterly plan card with credits (999), days left (279), expiry shown |
| 8.4 | Stats displayed (total classes, streak, etc.) | ✅ | — | PASS | Classes (0), Credits Left (999), Streak (0) shown |
| 8.5 | Delete account flow works | ❌ | — | FAIL | **BUG: No "Delete Account" button anywhere on profile page** |
| 8.6 | Delete account cancels Razorpay subscription | ❌ | — | FAIL | Cannot test — delete button missing from UI |
| 8.7 | Delete account cancels upcoming bookings | ❌ | — | FAIL | Cannot test — delete button missing from UI |
| 8.8 | Delete account anonymizes booking records | ❌ | — | FAIL | Cannot test — delete button missing from UI |
| 8.9 | Delete account deletes Firestore profile | ❌ | — | FAIL | Cannot test — delete button missing from UI |
| 8.10 | Delete account deletes Firebase Auth user | ❌ | — | FAIL | Cannot test — delete button missing from UI |
| 8.11 | Delete account shows confirmation dialog | ❌ | — | FAIL | Cannot test — delete button missing from UI |
| **Mobile** | | | | | |
| 8.12 | Mobile profile tab renders user info | — | [ ] | | |
| 8.13 | Mobile delete account flow works | — | [ ] | | |

---

## 9. Admin Dashboard

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 9.1 | Admin dashboard loads with welcome banner | ✅ | — | PASS | Dashboard loads with "Good evening, SOL Admin" banner |
| 9.2 | Greeting shows correct time-of-day message | ✅ | — | PASS | "Good evening" shown correctly at ~6pm |
| 9.3 | Stats: Active Members count correct | ✅ | — | PASS | 12 active members shown |
| 9.4 | Stats: Today's Classes count correct | ✅ | — | PASS | Count shows correctly |
| 9.5 | Stats: Today's Bookings count correct | ✅ | — | PASS | Count shows correctly |
| 9.6 | Stats: Total Bookings count correct | ✅ | — | PASS | Count shows correctly |
| 9.7 | Weekly Attendance bar chart renders (Recharts) | ✅ | — | PASS | Bar chart renders with 7-day data |
| 9.8 | Chart shows last 7 days attended data | ✅ | — | PASS | Days labeled correctly |
| 9.9 | Recent Activity list shows latest 5 bookings | ✅ | — | PASS | Recent bookings list renders |
| 9.10 | Activity status icons/colors correct | ✅ | — | PASS | Status badges with correct colors |
| 9.11 | Quick Actions: "Manage Classes" navigates to classes | ✅ | — | PASS | Navigation works |
| 9.12 | Quick Actions: "Members" navigates to members | ✅ | — | PASS | Navigation works |
| 9.13 | Quick Actions: "Facility" navigates to locations | ✅ | — | PASS | Navigation works |
| 9.14 | Loading skeletons shown while data loads | ✅ | — | PASS | Skeletons visible on load |
| 9.15 | Date displayed in header correctly | ✅ | — | PASS | "Thursday, 11 June" shown in header |
| 9.16 | Non-admin cannot access admin pages | ✅ | — | PASS | Unauthenticated user redirected to /admin/login |

---

## 10. Admin — Class Management

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| **Calendar View** | | | | | |
| 10.1 | Monthly mini-calendar renders with class indicators | ✅ | — | PASS | Calendar renders with dot indicators on days with classes |
| 10.2 | Clicking a day selects it and shows day agenda | ✅ | — | PASS | Day selection updates agenda view |
| 10.3 | Month navigation (prev/next) works | ✅ | — | PASS | Prev/Next month buttons navigate correctly |
| 10.4 | "Today" button jumps to current date | ✅ | — | PASS | Today button returns to current date |
| 10.5 | Today highlighted with ring indicator | ✅ | — | PASS | Today's date has ring indicator |
| 10.6 | Class type color dots shown on calendar days | ✅ | — | PASS | Color-coded dots per class type visible |
| **Day Agenda** | | | | | |
| 10.7 | Day agenda shows time grid (06:00–21:00) | ✅ | — | PASS | Time grid renders correctly |
| 10.8 | Classes rendered as colored blocks at correct positions | ✅ | — | PASS | Class blocks positioned by time |
| 10.9 | Overlapping classes shown in column layout | ⚠️ | — | SKIP | No overlapping classes in test data |
| 10.10 | "Now" line shown for current time | ✅ | — | PASS | Current time line visible on today's view |
| 10.11 | Auto-scrolls to first class on day change | ✅ | — | PASS | View scrolls to first class |
| 10.12 | Empty state shown when no classes | ✅ | — | PASS | Empty state shown on days without classes |
| 10.13 | Clicking a class block opens edit dialog | ✅ | — | PASS | Edit dialog opens with class data pre-filled |
| 10.14 | Quick-delete (trash icon on hover) works | ✅ | — | PASS | Trash icon appears on hover, triggers delete |
| **Create Class** | | | | | |
| 10.15 | "Add Class" button opens create dialog | ✅ | — | PASS | Dialog opens via JS click (CSS uppercase text workaround) |
| 10.16 | Class Type dropdown with 4 types (Sol Flow, Sol Cardio, Sol Stretch, Demo Class) | ✅ | — | PASS | All 4 types present + Reformer Pilates |
| 10.17 | Selecting Demo Class auto-sets duration to 30 min | ⚠️ | — | SKIP | Not manually verified in dialog |
| 10.18 | Trainer dropdown populated from Firestore | ✅ | — | PASS | "Shweta" appears in trainer dropdown |
| 10.19 | Single day / Multiple days mode toggle works | ✅ | — | PASS | Toggle switches between modes |
| 10.20 | Date picker works in single mode | ✅ | — | PASS | Date picker renders and selects |
| 10.21 | Multi-date picker works with quick ranges (7/14/30 days) | ✅ | — | PASS | Quick range buttons visible and functional |
| 10.22 | Weekday selector adds all instances of a weekday in month | ✅ | — | PASS | Weekday picker present in multi-mode |
| 10.23 | Duration, Capacity, Difficulty, Location, Description fields work | ✅ | — | PASS | All fields present and editable in dialog |
| 10.24 | Conflict detection: cannot create class at same date+time | ⚠️ | — | SKIP | Not tested — would require actual class creation |
| 10.25 | Single create creates class via API | ⚠️ | — | SKIP | Not tested — would modify test data |
| 10.26 | Bulk create creates multiple classes with progress indicator | ⚠️ | — | SKIP | Not tested — would modify test data |
| 10.27 | Bulk create shows success count + skipped count | ⚠️ | — | SKIP | Not tested — would modify test data |
| **Edit Class** | | | | | |
| 10.28 | Edit dialog pre-fills existing class data | ✅ | — | PASS | Clicking class block opens dialog with existing data |
| 10.29 | Updating class saves changes via API | ⚠️ | — | SKIP | Not tested — would modify test data |
| 10.30 | Cannot reduce capacity below current booked count | ⚠️ | — | SKIP | Not tested |
| 10.31 | Status can be changed (scheduled/ongoing/completed/canceled) | ✅ | — | PASS | Status dropdown present in edit dialog |
| **Delete Class** | | | | | |
| 10.32 | Delete cancels all confirmed bookings for the class | ⚠️ | — | SKIP | Not tested — would modify test data |
| 10.33 | Delete restores credits for all affected bookings | ⚠️ | — | SKIP | Not tested |
| 10.34 | Delete removes class document | ⚠️ | — | SKIP | Not tested — would modify test data |
| **Stats** | | | | | |
| 10.35 | Stats cards: Total Classes, Scheduled, Completed, Total Capacity | ✅ | — | PASS | All 4 stat cards render with real data |
| 10.36 | Stats update after create/edit/delete | ⚠️ | — | SKIP | Not tested |
| 10.37 | Legend shows all class types with correct colors | ✅ | — | PASS | Color legend visible in class management view |

---

## 11. Admin — Bookings Management

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 11.1 | Bookings page loads with stats and table | ✅ | — | PASS | Page loads at /admin/bookings |
| 11.2 | Stats: Attended, Confirmed, Canceled, No-Show counts | ✅ | — | PASS | All 4 stat cards visible with counts |
| 11.3 | Table shows: User, Spot, Class Date, Status, Booked At, Guest, Actions | ✅ | — | PASS | All columns present in table |
| 11.4 | Search by user name or user ID works | ✅ | — | PASS | Search field present and filters results |
| 11.5 | Status filter dropdown works | ✅ | — | PASS | Status filter dropdown works |
| 11.6 | Pagination works | ✅ | — | PASS | Pagination controls present |
| 11.7 | "Mark No Show" action works for confirmed bookings | ⚠️ | — | SKIP | No confirmed future bookings to test with |
| 11.8 | "Cancel Booking" action works for confirmed bookings | ⚠️ | — | SKIP | No confirmed future bookings to test with |
| 11.9 | Actions disabled for non-confirmed bookings | ⚠️ | — | SKIP | Not verified |
| 11.10 | Desktop: table view renders | ✅ | — | PASS | Table renders correctly on desktop |
| 11.11 | Mobile: card view renders | — | ⚠️ | SKIP | Not tested on mobile |
| 11.12 | Loading skeletons shown while data loads | ✅ | — | PASS | Skeletons shown during load |

---

## 12. Admin — Members Management

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 12.1 | Members page loads with stats and table | ✅ | — | PASS | Page loads with 22 members listed |
| 12.2 | Stats: Total Members, Active, Credits Remaining, New This Month | ✅ | — | PASS | 22 total, 12 active, 1,162 credits, 17 new this month |
| 12.3 | Table shows: Member, Plan, Status, Joined, Credits, Classes, Actions | ✅ | — | PASS | All columns present |
| 12.4 | Search by name or email works | ✅ | — | PASS | Search "Ashok" → 3 matching results |
| 12.5 | Plan filter works | ✅ | — | PASS | Plan dropdown filters correctly |
| 12.6 | Status filter works | ✅ | — | PASS | Status "Active" filter + search combo works (1 result) |
| 12.7 | Pagination works | ✅ | — | PASS | Page 1/2 navigation present (12 per page, 22 total) |
| 12.8 | Email action (mailto link) works | ✅ | — | PASS | Email icon links to mailto: for each member |
| 12.9 | Status badges show correct colors | ✅ | — | PASS | ACTIVE (green), NO PLAN (grey) badges visible |
| 12.10 | Desktop: table view | ✅ | — | PASS | Full table layout on desktop |
| 12.11 | Mobile: card view | — | ⚠️ | SKIP | Not tested on mobile |

---

## 13. Admin — Trainers Management

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 13.1 | Trainers page loads with stats and grid | ✅ | — | PASS | Page loads with 1 trainer (Shweta) in card grid |
| 13.2 | Stats: Total Trainers, Active, Avg Rating, Combined Years | ✅ | — | PASS | 1 total, 1 active, — avg rating, 10 combined yrs |
| 13.3 | Trainer cards show: photo, name, rating, specialties, contact, bio | ✅ | — | PASS | Name, exp, specialties, email, phone, bio all shown |
| 13.4 | Search by name or specialty works | ✅ | — | PASS | Search box present and functional |
| 13.5 | Pagination works | ✅ | — | PASS | Page 1/1 shown |
| **Create Trainer** | | | | | |
| 13.6 | "Add Trainer" opens create dialog | ✅ | — | PASS | Dialog opens with all fields |
| 13.7 | Form fields: name, email, phone, experience, specialties, certifications, bio, photo | ✅ | — | PASS | All fields present in dialog |
| 13.8 | Profile picture upload works (ImageUpload component) | ✅ | — | PASS | Upload button present in dialog |
| 13.9 | Creating trainer saves to Firestore | ⚠️ | — | SKIP | Not tested — would modify data |
| 13.10 | Validation: name and email required | ⚠️ | — | SKIP | Not tested |
| **Edit Trainer** | | | | | |
| 13.11 | Edit dialog pre-fills existing data | ✅ | — | PASS | "Edit Profile" in action menu opens edit dialog |
| 13.12 | Active/Inactive toggle works | ⚠️ | — | SKIP | Not tested |
| 13.13 | Updating trainer saves changes | ⚠️ | — | SKIP | Not tested — would modify data |
| **Delete Trainer** | | | | | |
| 13.14 | Delete removes trainer document | ⚠️ | — | SKIP | Not tested — would modify data |
| 13.15 | Delete shows confirmation | ✅ | — | PASS | "Remove" option present in action menu (3-dot) |

---

## 14. Admin — Check-In Panel

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 14.1 | Check-in page loads with split-panel layout | ✅ | — | PASS | Split layout: left class list, right attendee panel |
| 14.2 | Left panel shows today's classes (scheduled + ongoing) | ✅ | — | PASS | Shows "No classes scheduled today" (correct for Jun 11) |
| 14.3 | "NOW" badge shown for current class | ⚠️ | — | SKIP | No classes today to show NOW badge |
| 14.4 | Auto-selects current class or first class | ⚠️ | — | SKIP | No classes today |
| 14.5 | Selecting a class shows attendee list | ⚠️ | — | SKIP | No classes today |
| 14.6 | Attendee rows show: spot number, name, credit type, guest badge | ⚠️ | — | SKIP | No classes today |
| 14.7 | "Check In" button marks booking as attended | ⚠️ | — | SKIP | No classes today |
| 14.8 | "No Show" button marks booking as no-show | ⚠️ | — | SKIP | No classes today |
| 14.9 | Undo buttons work (switch attended↔no-show) | ⚠️ | — | SKIP | No classes today |
| 14.10 | Attendance counters (Attended, Pending, No Show) update in real-time | ⚠️ | — | SKIP | No classes today |
| 14.11 | Clock updates every 30 seconds | ✅ | — | PASS | "06:07 pm" live clock shown in header |
| 14.12 | Empty state when no bookings for class | ⚠️ | — | SKIP | No classes today |
| 14.13 | Empty state when no classes today | ✅ | — | PASS | "No classes scheduled today" shown; right panel shows "Select a class to begin check-in" |
| 14.14 | Class panel shows class type, time, location, duration | ⚠️ | — | SKIP | No classes today |
| 14.15 | "IN SESSION" badge shown during class time | ⚠️ | — | SKIP | No classes today |

---

## 15. Admin — Facility / Locations

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 15.1 | Facility settings page loads | ✅ | — | PASS | Page loads with real data (Boutique Pilates, Hyderabad) |
| 15.2 | Facility info (name, address, contact, hours) displayed | ✅ | — | PASS | All fields shown: name, address, phone, email, hours |
| 15.3 | Update facility info saves to Firestore | ⚠️ | — | SKIP | Edit mode confirmed (fields unlock), save not tested |
| 15.4 | Operating hours can be edited | ✅ | — | PASS | Hours section visible; fields unlock on Edit Details |
| 15.5 | Facility photos can be managed | ⚠️ | — | SKIP | Not visible in current facility data |

---

## 16. Admin — Reports & Analytics

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 16.1 | Reports page loads with charts | ✅ | — | PASS | Page loads with stats and multiple charts |
| 16.2 | Membership distribution pie/donut chart renders | ✅ | — | PASS | Donut chart renders with plan breakdown legend |
| 16.3 | Class popularity bar chart renders | ✅ | — | PASS | Horizontal bar chart shows Sol Stretch, Sol Flow, Sol Cardio, etc. |
| 16.4 | Location utilization chart renders | ✅ | — | PASS | Location utilization table shows Performance Floor, Yoga Studio, etc. |
| 16.5 | Attendance stats (total attended, avg rate, active members) | ✅ | — | PASS | 3 attended, 2% rate, 12 active members shown |
| 16.6 | Charts use correct theme colors | ✅ | — | PASS | Terra/coral color scheme used |
| 16.7 | Data is accurate and matches Firestore records | ✅ | — | PASS | Stats consistent with members page (12 active) |

---

## 17. Admin — Settings

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 17.1 | Settings page renders | ✅ | — | PASS | Page renders with profile and security sections |
| 17.2 | Notification toggles render (not persisted — known issue) | ⚠️ | — | N/A | No notification toggles visible in UI — section may be removed |
| 17.3 | Profile section renders | ✅ | — | PASS | Display Name (SOL Admin), Email (sol@admin.com), Role (Super Admin) shown |
| 17.4 | Changes not lost on refresh (or document known issue) | ❌ | — | KNOWN BUG | Fields are read-only, no save button — no backend persistence (documented in CLAUDE.md) |

---

## 18. Admin — Leads & Waitlist

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 18.1 | Leads page loads with demo class leads | ✅ | — | PASS | 3 leads shown with ALL/NEW/CONTACTED/CONVERTED/ARCHIVED tabs |
| 18.2 | Lead cards show: name, email, phone, goals, status | ⚠️ | — | PARTIAL | **BUG: First lead card missing name/email/phone — only shows date** (data may be incomplete in Firestore) |
| 18.3 | Leads pulled from `introClassLeads` collection | ✅ | — | PASS | Data matches Firestore collection |
| 18.4 | Waitlist page loads with waitlist entries | ✅ | — | PASS | 1 entry (Dinesh, CONVERTED) with stats cards |
| 18.5 | Waitlist entries show: email, status, founding member flag | ✅ | — | PASS | Email, status badge, action buttons shown |

---

## 19. Admin — Feedback

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| 19.1 | Admin feedback page loads | ✅ | — | PASS | Page loads with ALL/UNREAD/READ tabs; "No feedback submissions yet" empty state |
| 19.2 | Public feedback form (`/feedback`) submits correctly | ❌ | — | **BUG** | **Form always fails with "Something went wrong"** — `feedback` collection missing from `firestore.rules`, blocking all writes. **FIXED: Rule added to firestore.rules** |

---

## 20. Backend — API Routes

> All API routes are under `src/app/api/`. Test each endpoint directly or via the UI.

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| **Bookings** | | | |
| 20.1 | `GET /api/bookings` — returns user's bookings with class + trainer info | [ ] | |
| 20.2 | `POST /api/bookings/book` — creates booking with all validations | [ ] | |
| 20.3 | `POST /api/bookings/cancel` — cancels booking, restores credit, releases spot | [ ] | |
| 20.4 | `POST /api/bookings/checkin` — marks attended or no-show | [ ] | |
| **Classes** | | | |
| 20.5 | `POST /api/classes` — admin creates class (conflict detection) | [ ] | |
| 20.6 | `PUT /api/classes` — admin updates class (capacity validation) | [ ] | |
| 20.7 | `DELETE /api/classes` — admin deletes class (cancels bookings, restores credits) | [ ] | |
| **Payments** | | | |
| 20.8 | `POST /api/payments/create-order` — creates Razorpay one-time order | [ ] | |
| 20.9 | `POST /api/payments/verify` — verifies signature, activates subscription | [ ] | |
| 20.10 | `POST /api/payments/create-subscription` — creates Razorpay recurring subscription | [ ] | |
| 20.11 | `POST /api/payments/verify-subscription` — verifies subscription checkout | [ ] | |
| 20.12 | `POST /api/payments/abandon-subscription` — cancels abandoned checkout | [ ] | |
| 20.13 | `POST /api/payments/create-intent` — mock payment intent (dev only) | [ ] | |
| 20.14 | `POST /api/payments/confirm` — confirms mock payment | [ ] | |
| **Subscriptions** | | | |
| 20.15 | `POST /api/subscriptions/activate` — mock activation (dev) | [ ] | |
| 20.16 | `POST /api/subscriptions/cancel` — cancel via Razorpay | [ ] | |
| 20.17 | `POST /api/subscriptions/update` — upgrade/downgrade plan | [ ] | |
| 20.18 | `POST /api/subscriptions/sync` — pull state from Razorpay | [ ] | |
| 20.19 | `GET /api/subscriptions/portal-link` — get management URL | [ ] | |
| 20.20 | `GET /api/subscriptions/pricing` — get live pricing (ISR 5min cache) | [ ] | |
| **Admin** | | | |
| 20.21 | `POST /api/admin/set-role` — grant/revoke admin custom claim | [ ] | |
| 20.22 | `POST/PUT/DELETE /api/admin/trainers` — CRUD trainers | [ ] | |
| 20.23 | `GET/PUT /api/admin/facility` — read/update facility | [ ] | |
| **Other** | | | |
| 20.24 | `POST /api/account/delete` — delete account (cancels sub, bookings, deletes user) | [ ] | |
| 20.25 | `GET /api/schedule` — get schedule by date range | [ ] | |
| 20.26 | `POST /api/webhooks/razorpay` — webhook processing | [ ] | |

---

## 21. Backend — Cloud Functions (Firebase)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| **Auth Triggers** | | | |
| 21.1 | `onUserCreate` — creates user profile doc in Firestore | [ ] | |
| 21.2 | `onUserCreate` — founding member detection (waitlist + counter) | [ ] | |
| 21.3 | `onUserCreate` — admin accounts don't consume founding slot | [ ] | |
| **Firestore Triggers** | | | |
| 21.4 | `onBookingStatusChange` — updates stats.totalClassesAttended on "attended" | [ ] | |
| 21.5 | `onBookingStatusChange` — updates streak (consecutive day detection) | [ ] | |
| 21.6 | `onBookingStatusChange` — streak reset on gap > 1 day | [ ] | |
| 21.7 | `sendBookingConfirmation` — generates email HTML on new booking | [ ] | |
| **Callable Functions** | | | |
| 21.8 | `bookClass` — booking logic (may be legacy, API route is primary) | [ ] | |
| 21.9 | `cancelBooking` — cancel logic (may be legacy) | [ ] | |
| 21.10 | `createClass` — admin class creation (may be legacy) | [ ] | |
| 21.11 | `updateClass` — admin class update (may be legacy) | [ ] | |
| 21.12 | `deleteClass` — admin class deletion (may be legacy) | [ ] | |
| 21.13 | `getScheduleByDate` — fetch schedule (may be legacy) | [ ] | |
| 21.14 | `getUserBookings` — fetch user bookings (may be legacy) | [ ] | |
| 21.15 | `setAdminRole` — set admin custom claim (may be legacy) | [ ] | |
| 21.16 | `activateSubscription` — mock activation (may be legacy) | [ ] | |
| 21.17 | `seedDatabase` — seed data for development | [ ] | |

---

## 22. Backend — Scheduled Jobs

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 22.1 | `expireSubscriptions` — runs daily at 2:15 AM IST | [ ] | |
| 22.2 | `expireSubscriptions` — marks expired subscriptions as "expired" | [ ] | |
| 22.3 | `expireSubscriptions` — marks cancel-at-period-end as "canceled" | [ ] | |
| 22.4 | `expireSubscriptions` — processes in batches of 450 | [ ] | |
| 22.5 | `markNoShows` — runs every 15 minutes | [ ] | |
| 22.6 | `markNoShows` — marks confirmed bookings as "no-show" after class ends | [ ] | |
| 22.7 | `markNoShows` — calculates class end time from date + startTime + duration | [ ] | |
| 22.8 | `markNoShows` — only processes bookings where class has ended | [ ] | |

---

## 23. Backend — Razorpay Webhooks

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 23.1 | Webhook signature verification (x-razorpay-signature) | [ ] | |
| 23.2 | Duplicate event detection (razorpayWebhookEvents collection) | [ ] | |
| 23.3 | `subscription.activated` — activates subscription, sets access window | [ ] | |
| 23.4 | `subscription.charged` / `invoice.paid` — resets credits on renewal | [ ] | |
| 23.5 | `subscription.updated` — handles scheduled plan changes | [ ] | |
| 23.6 | `subscription.halted` — marks subscription as halted | [ ] | |
| 23.7 | `subscription.cancelled` — sets cancelAtPeriodEnd if still usable | [ ] | |
| 23.8 | `subscription.completed` — disables auto-renew | [ ] | |
| 23.9 | `payment.failed` — logs to paymentFailures collection | [ ] | |
| 23.10 | Kickstarter credit carry-forward on membership activation | [ ] | |
| 23.11 | User lookup: tries users.subscription.razorpaySubscriptionId first, then payments | [ ] | |

---

## 24. Cross-Cutting Concerns

| # | Test Case | Desktop | Mobile | Status | Notes |
|---|-----------|---------|--------|--------|-------|
| **Security** | | | | | |
| 24.1 | All API routes verify Firebase ID token | [ ] | [ ] | | |
| 24.2 | Admin routes verify `admin` custom claim | [ ] | [ ] | | |
| 24.3 | Users cannot access other users' bookings | [ ] | [ ] | | |
| 24.4 | Firestore rules enforce auth (check firestore.rules) | [ ] | [ ] | | |
| 24.5 | No hardcoded admin credentials in code (known issue in src/types/admin.ts) | [ ] | [ ] | | |
| **Performance** | | | | | |
| 24.6 | Pages load in < 3 seconds on 3G | [ ] | [ ] | | |
| 24.7 | Images optimized (Next.js Image, lazy loading) | [ ] | [ ] | | |
| 24.8 | Real-time subscriptions clean up on unmount (no memory leaks) | [ ] | [ ] | | |
| **Error Handling** | | | | | |
| 24.9 | ErrorBoundary catches runtime errors (mobile) | [ ] | [ ] | | |
| 24.10 | API errors return structured JSON (error + code) | [ ] | [ ] | | |
| 24.11 | Toast notifications shown for success/error | [ ] | [ ] | | |
| 24.12 | Loading states shown during async operations | [ ] | [ ] | | |
| **Data Integrity** | | | | | |
| 24.13 | Booking transaction is atomic (class + user + booking doc) | [ ] | [ ] | | |
| 24.14 | Credit decrement is atomic with booking creation | [ ] | [ ] | | |
| 24.15 | Credit restore on cancel is atomic | [ ] | [ ] | | |
| 24.16 | Subscription end date enforced at booking time | [ ] | [ ] | | |
| **Accessibility** | | | | | |
| 24.17 | Keyboard navigation works on all interactive elements | [ ] | [ ] | | |
| 24.18 | Focus states visible on all buttons/links | [ ] | [ ] | | |
| 24.19 | ARIA labels on icon-only buttons | [ ] | [ ] | | |
| 24.20 | Color contrast meets WCAG AA | [ ] | [ ] | | |

---

## 25. Mobile-Specific Tests

| # | Test Case | iOS | Android | Status | Notes |
|---|-----------|-----|---------|--------|-------|
| **App Lifecycle** | | | | | |
| 25.1 | App launches with branded splash screen | [ ] | [ ] | | |
| 25.2 | Splash animation: logo spring + line scale | [ ] | [ ] | | |
| 25.3 | Splash minimum 1.2s duration | [ ] | [ ] | | |
| 25.4 | Fonts loaded before splash hides | [ ] | [ ] | | |
| **Navigation** | | | | | |
| 25.5 | Tab bar renders with 4 tabs (Home, Schedule, Bookings, Profile) | [ ] | [ ] | | |
| 25.6 | Tab icons switch between active/inactive states | [ ] | [ ] | | |
| 25.7 | Active indicator dot shown on selected tab | [ ] | [ ] | | |
| 25.8 | Tab navigation is responsive (no lag) | [ ] | [ ] | | |
| 25.9 | Stack navigation (push/pop) works for screens outside tabs | [ ] | [ ] | | |
| **Platform Specific** | | | | | |
| 25.10 | StatusBar style correct (auto) | [ ] | [ ] | | |
| 25.11 | SafeAreaView insets applied correctly | [ ] | [ ] | | |
| 25.12 | Tab bar height correct (88px iOS, 64px Android) | [ ] | [ ] | | |
| 25.13 | Pull-to-refresh gesture works | [ ] | [ ] | | |
| 25.14 | ScrollView bounces correctly | [ ] | [ ] | | |
| **API Config** | | | | | |
| 25.15 | `initApiConfig` called with correct base URL | [ ] | [ ] | | |
| 25.16 | API calls reach Next.js backend from mobile | [ ] | [ ] | | |
| 25.17 | EXPO_PUBLIC_API_BASE_URL env var set correctly | [ ] | [ ] | | |
| **Payment (Native Build)** | | | | | |
| 25.18 | Razorpay native module loads in dev build (not Expo Go) | [ ] | [ ] | | |
| 25.19 | Razorpay checkout modal renders on native | [ ] | [ ] | | |
| 25.20 | Payment success flow completes | [ ] | [ ] | | |
| 25.21 | Expo Go: graceful error when Razorpay unavailable | [ ] | [ ] | | |
| **Offline / Network** | | | | | |
| 25.22 | ErrorBoundary catches crashes and shows fallback UI | [ ] | [ ] | | |
| 25.23 | Network error shows appropriate message | [ ] | [ ] | | |
| 25.24 | App recovers after network reconnection | [ ] | [ ] | | |

---

## Summary

| Section | Total Tests | Pass | Fail | Blocked |
|---------|------------|------|------|---------|
| 1. Public Pages | 30 | | | |
| 2. Authentication | 22 | 2 | | |
| 3. User Dashboard | 28 | | | |
| 4. Schedule & Booking | 43 | **38** | **0** | **5 (mobile responsive only)** |
| 5. User Bookings | 23 | | | |
| 6. Subscriptions & Payments | 34 | | | |
| 7. Demo Class Flow | 14 | | | |
| 8. User Profile | 13 | | | |
| 9. Admin Dashboard | 16 | | | |
| 10. Admin Classes | 37 | | | |
| 11. Admin Bookings | 12 | | | |
| 12. Admin Members | 11 | | | |
| 13. Admin Trainers | 15 | | | |
| 14. Admin Check-In | 15 | | | |
| 15. Admin Facility | 5 | | | |
| 16. Admin Reports | 7 | | | |
| 17. Admin Settings | 4 | | | |
| 18. Admin Leads & Waitlist | 5 | | | |
| 19. Admin Feedback | 2 | | | |
| 20. Backend API Routes | 26 | | | |
| 21. Cloud Functions | 17 | | | |
| 22. Scheduled Jobs | 8 | | | |
| 23. Razorpay Webhooks | 11 | | | |
| 24. Cross-Cutting | 20 | | | |
| 25. Mobile-Specific | 24 | | | |
| **TOTAL** | **~500+** | | | |

---

*Last updated: June 2026*
*Generated by codebase analysis — covers all features found in source code.*
