# FitConnect Pro — Issue Tracker

> Last updated: 2026-06-11
> Status key: 🔴 Not started | 🟡 Needs clarification | 🟢 Done | ⚡ In progress

---

## Issue List

### #1 — Schedule ends at June 24th
**Status:** 🟡 Needs clarification  
**Description:** The app's schedule/calendar stops showing dates after June 24th.  
**Notes:** Schedule end date is tied to subscription `endDate`. Could be the test account's subscription expiry OR a hardcoded calendar range. Need to identify which page/view and which account is seeing this.

---

### #2 — Adding/deleting classes UX improvement
**Status:** 🟡 Needs clarification  
**Description:** Adding/deleting classes in admin should be done more seamlessly.  
**Notes:** Admin class management lives in `src/app/admin/classes/page.tsx`. Need specifics on what friction point exists (too many clicks, no inline edit, confirmation steps, etc.).

---

### #3 — Updated membership pricing
**Status:** 🔴 Not started  
**Description:** Pricing for GROUP MEMBERSHIPS — Reformer (Peak Hours) needs to be updated.  
**New prices (from spreadsheet):**
| Plan | Sessions | Duration | SOL Price (₹) | Founding Member (₹) 15% |
|------|----------|----------|--------------|------------------------|
| 2x/week — Quarterly | 24 | 3 months | 40,800 | 34,680 |
| 2x/week — 6 Months | 48 | 6 months | 72,000 | 61,200 |
| 3x/week — Quarterly | 36 | 3 months | 61,200 | 52,020 |
| 3x/week — 6 Months | 72 | 6 months | 108,000 | 91,800 |

**Current prices in code** (`shared/src/types/subscription.ts`):
- 2x Quarterly: ₹36,000 (founding ₹30,600)
- 2x 6mo: ₹64,000 (founding ₹54,400)
- 3x Quarterly: ₹54,000 (founding ₹45,900)
- 3x 6mo: ₹96,000 (founding ₹81,600)

**Notes:** 2-WEEK KICKSTARTER plan data was partially cut off in the spreadsheet image — needs clarification on Kickstarter pricing too.

---

### #4 — Cancellation only allowed 12 hours before class
**Status:** 🔴 Not started  
**Description:** Users can currently cancel any booking at any time. Per policy set in meeting, cancellations should only be allowed up to 12 hours before the class start time.  
**File to fix:** `src/app/api/bookings/cancel/route.ts` — no time-based restriction exists currently.

---

### #5 — Excessive side spacing + section separation
**Status:** 🟡 Needs clarification  
**Description:** Large empty whitespace on left and right sides of pages (circled in green in screenshot). Sections should be visually separated by changing background color between them.  
**Notes:** Screenshot shows the "Our Story" (`/our-story`) page at solpilatesstudio.in. Need confirmation this is the `/our-story` page in the FitConnect app, and which sections need background color changes.

---

### #6 — Per-session price ₹1000 + add "SolMare coupon"
**Status:** 🟡 Deferred — SolMare coupon placement to be confirmed with client. Intro class (drop_in) is already ₹1,000 in code.

---

### #7 — Studio phone number update
**Status:** 🔴 Not started  
**Description:** Update studio phone number to **9642004005**.  
**File:** Phone number is stored in Firestore `gymCenters` collection, editable via Admin → Locations page. The `GymCenter.contactInfo.phone` field in `shared/src/types/gym.ts`.

---

### #8 — Maximum class slots = 10
**Status:** 🔴 Not started  
**Description:** Maximum slots per class should be capped at 10.  
**File:** `src/app/admin/classes/page.tsx` — default capacity is currently 12, max is 100. Need to change default to 10 and cap at 10.

---

### #9a — Increase font size wherever needed
**Status:** 🟡 Needs clarification  
**Description:** Font sizes need to be increased in certain areas.  
**Notes:** (From reminders image) Vague — which specific pages or components have font size issues?

---

### #9b — "Pricing not so soon in app"
**Status:** ⏭️ Ignored (per client request)

---

### #9c — Montserrat font
**Status:** 🟡 Needs clarification  
**Description:** Switch to Montserrat (Montesara) font.  
**Notes:** Current font is Inter (noted in CLAUDE.md as a known issue — "consider upgrading to Satoshi or Space Grotesk"). Is this a full global font swap or specific headings?

---

### #9d — "Heading don't needed from brand"
**Status:** 🟡 Deferred — to be clarified later

---

### #9e — Sol Flow, Sol Cardio: reduce some height
**Status:** 🟡 Needs clarification  
**Description:** The Sol Flow and Sol Cardio class cards/sections have too much height — need to be reduced.  
**Notes:** Could refer to class cards on the schedule page, or class type cards on the landing page.

---

### #9f — Create class for "doing it whole time" instead of one day
**Status:** 🟡 Needs clarification  
**Description:** Unclear — possibly means creating a recurring/ongoing class that spans an extended period rather than a single day.

---

### #9g — Classes tab: show dates similar to Outlook
**Status:** 🟡 Deferred — check git history first; if not done, skip for now

---

### #9h — Classes location keeps changing
**Status:** 🟡 Needs clarification  
**Description:** The location displayed on class cards keeps changing unexpectedly.  
**Notes:** Could be a UI rendering bug or data consistency issue in Firestore.
