# App Store Review Report — FitConnect Pro (iOS)

Audit of the Expo/React Native app at `mobile/` against Apple's App Store Review Guidelines (https://developer.apple.com/app-store/review/guidelines/). Findings are grouped into **blockers** (will cause rejection) and **changes required** (group-by-area work list).

---

## Take Care of First (Blockers)

These will reject the binary on first review. Fix before submission.

1. **Payments — Path 2 chosen: external/reader-style (Guideline 3.1.1, 3.1.3).** ⏳ TODO
   The app sells class credits / memberships consumed inside the app. Rather than implementing StoreKit IAP, we're going **fully external**: all purchases happen on the web, the iOS app contains zero purchase UI.

   Apple **does accept this** — it's how ClassPass, Mindbody, Equinox, etc. ship — but the rules are strict. Sloppy implementation = first-review rejection.

   **Hard rules (any violation = rejection):**
   - **No prices** anywhere in the iOS app ("$99/mo", "5 classes for $50", etc.).
   - **No "Buy" / "Subscribe" / "Upgrade" / "View Plans" buttons.**
   - **No links or URLs** to pricing/checkout/signup from inside the app — even footer links.
   - **No CTAs** like "Tap here to purchase on our website" or "Manage on web →".
   - A *neutral* informational statement is allowed ("Memberships are managed on the web") — but no nudge, no link, no button.

   **Optional escape hatch:** Apple's **External Link Account Entitlement** (3.1.3(a)) lets a reader app embed a single external link for account management, but it requires filing with Apple and using Apple's system-provided disclosure sheet. Most apps skip this and stay fully neutral.

   **Implementation guardrails to apply:**
   1. Hide the `/subscribe` route on iOS (or gate it behind `Platform.OS !== 'ios'`).
   2. Remove the Membership row's "View Plans →" CTA on iOS — replace with a static info card: *"Memberships are managed on the web."*
   3. Strip every price display from the iOS bundle (plan cards, receipts, anywhere `$` appears).
   4. Remove the `mock-processor.ts` import path from the iOS bundle.
   5. Keep booking / cancel / schedule / profile flows untouched.
   6. Web app (`src/app/`) keeps full purchase flow — that's where users buy.

2. **Account deletion in-app (Guideline 5.1.1(v)).** ✅ DONE
   Implemented `POST /api/account/delete` (cancels upcoming bookings, releases spots, anonymizes history, deletes user + auth record). New "Delete Account" flow under Profile → Danger Zone with password re-auth.

3. **Privacy policy link in-app (Guideline 5.1.1).** ✅ DONE
   Privacy Policy + Terms rows added under Profile → Legal. Legal disclosure under signup "Create Account" button. **TODO before submission:** replace placeholder URLs `https://fitconnectpro.app/privacy` and `/terms` with real hosted pages.

4. **Privacy Manifest `PrivacyInfo.xcprivacy` (Guideline 3.2.2 / 5.1.2).** ✅ DONE
   Created `mobile/PrivacyInfo.xcprivacy` with declarations for email, name, user ID, usage data, crash data; `NSPrivacyTracking: false`; required-reason APIs (`UserDefaults` CA92.1, `FileTimestamp` C617.1). Mirrored in `app.json` under `ios.privacyManifests`.

5. **Build number missing in `mobile/app.json`.** ✅ DONE
   Added `ios.buildNumber: "1"` and `ITSAppUsesNonExemptEncryption: false` to skip the export-compliance prompt every upload.

---

## Changes Required (by section)

### A. Identity & Configuration (`mobile/app.json`) ✅ DONE
- ✅ `ios.buildNumber: "1"` set (bump per upload).
- ✅ `ios.supportsTablet: true` — iPad design verified in portrait. Root `orientation: "portrait"` locks iPad to portrait too, so reviewers won't test landscape.
- ✅ `ITSAppUsesNonExemptEncryption: false` — skips export compliance prompt per upload.
- ✅ `userInterfaceStyle: "light"` locked (matches the peach/terra palette).
- ⏳ TODO: confirm `bundleIdentifier: "com.fitconnect.pro"` is registered in App Store Connect (this is a console step, not code).

### B. Privacy & Permissions ✅ DONE (code) / ⏳ TODO (App Store Connect)
- ✅ `mobile/PrivacyInfo.xcprivacy` created with declarations for email, name, user ID, usage data, crash data; `NSPrivacyTracking: false`; required-reason APIs (`UserDefaults` CA92.1, `FileTimestamp` C617.1).
- ✅ Privacy Policy URL linked from Profile → Legal **and** the signup form's legal disclosure.
- ✅ No `NSUsageDescription` strings declared — none of camera/location/photos/etc. are used. (Pre-declaring unused permissions is itself a rejection trigger.)
- ⏳ TODO: mirror the same disclosures in App Store Connect → App Privacy questionnaire.

### C. Auth (Guideline 4.8) ✅ DONE
- ✅ Email/password only — Apple Sign-In not required at this stage. (Becomes mandatory the moment Google/Facebook/etc. is added.)
- ✅ In-app **Delete Account** flow under Profile → Danger Zone: destructive confirm → password re-auth → `POST /api/account/delete` (releases upcoming spots, anonymizes booking history, deletes user doc + Auth user) → signs out → routes to `/login`.

### D. Payments (Guideline 3.1.1, 3.1.3)
Pick one path:

- **Path 1 — IAP (recommended for retention):**
  - Replace the custom card form with `expo-in-app-purchases` / StoreKit.
  - Define products in App Store Connect: class packs (consumables), memberships (auto-renewable subscriptions).
  - Server-side receipt validation in a Cloud Function before granting credits.
  - Honor restore-purchases.

- **Path 2 — Reader-style / external (allowed under 3.1.3(d) for fitness):**
  - Remove all in-app purchase UI from iOS.
  - Allow the user to use credits bought elsewhere; no upsell, no pricing, no "Buy" button visible to iOS users.
  - Note: this is strict — even mentioning a price in the app is grounds for rejection.

### E. Push Notifications (Guideline 4.5.4)
- Currently not implemented. If added:
  - Ask consent before requesting the OS prompt with a soft-ask screen explaining why.
  - Never use pushes for marketing without an opt-in toggle.
  - Provide an in-app preferences screen to disable categories.

### F. Performance & Stability (Guideline 2.1) ✅ partial
- ✅ Top-level `ErrorBoundary` wraps the navigator (`mobile/components/ErrorBoundary.tsx`). Render crashes show a recoverable "Try Again" screen instead of a white screen.
- ⏳ TODO: add a real crash reporter (Sentry / Firebase Crashlytics) — the boundary only logs to `console.warn` today.
- ⏳ TODO: replace raw `Alert.alert("Network request failed")` with a friendlier toast / retry pattern for known network errors. Acceptable for v1, polish later.
- ⏳ TODO: smoke test cold-start under 3s on iPhone SE / iPhone 12 mini, on a real device on cellular, before submission.

### G. UI / UX (Guidelines 4.0, 4.1) ✅ partial
- ✅ Empty states already exist in Schedule (no classes), Bookings (no bookings), Home (no classes today).
- ✅ Safe-area: iPad scope dropped (`supportsTablet: false`). Dynamic Island layouts inherit from `react-native-safe-area-context` already used on every screen.
- ⏳ TODO: tap-target audit — confirm 44×44pt minimum on the small icon buttons (eye toggle, chevron rows, date strip days). Spot check, not a guaranteed issue.
- ⏳ TODO: "no internet" empty state — currently network failures only surface via `Alert.alert`.
- ⏳ TODO: copy pass for iOS terminology ("tap" vs "click"). Not seen in current code, but worth a final read.

### H. Content & Legal (Guidelines 1.x, 5.1) ⏳ partial
- ⏳ TODO: host real Privacy Policy + Terms pages and replace placeholders `https://fitconnectpro.app/privacy` and `/terms` (referenced in `mobile/app/(tabs)/profile.tsx` and `mobile/app/login.tsx`).
- ✅ In-app Support: Help & FAQ now opens a real `mailto:` (solpilatesstudio.in@gmail.com) and `tel:+12125550180` via `Linking.openURL` — provides a working contact channel inside the app.
- ⏳ TODO: a hosted **Support URL** is also required by the App Store Connect listing (separate field).
- ✅ No user-generated content — 1.2 / 1.6 moderation rules don't apply. Re-review if reviews/comments are added later.

### I. Build & Submission Hygiene ✅ partial
- ✅ No `console.log` / `console.debug` / `console.info` in `mobile/app` or `mobile/components`.
- ✅ No `@ts-ignore` / `@ts-expect-error` / `FIXME` / `HACK` markers in mobile code.
- ✅ Type checks clean across `mobile/`, `shared/` (one pre-existing `navigator` warning in `shared/src/firebase/config.ts` unrelated to App Store work).
- ⏳ TODO (Path 2 dependency): remove `mock-processor.ts` and any payment UI from the iOS bundle once Path 2 lands.
- ⏳ TODO (Firebase console step): restrict the `EXPO_PUBLIC_FIREBASE_API_KEY` by iOS bundle ID + Android package + web origin. Anyone reading the IPA can extract these keys; bundle-ID restriction is the only meaningful defense.
- ⏳ TODO (App Store Connect step): TestFlight internal build → external review → App Store submission. Provide reviewer credentials (`alice@test.com / Alice123!` from the seed) plus a 1-paragraph note explaining the booking flow.

### J. App Store Connect Listing ⏳ user action — not code
All of this is configured in the App Store Connect web console, not in the repo. Treat this as a pre-submission checklist.

- ⏳ Screenshots: **6.9" (iPhone 16 Pro Max)** is mandatory; 6.5" / 5.5" needed if you're supporting older devices. Since `supportsTablet: true`, **iPad Pro 13"** screenshots are also required.
- ⏳ App preview video — optional, boosts conversion.
- ⏳ Age rating questionnaire — likely 4+ for a fitness booking app.
- ⏳ Category — Health & Fitness (primary), Lifestyle (secondary).
- ⏳ Localized name, subtitle, keywords (one set per supported locale; English-US minimum).
- ⏳ Three required URLs: **Marketing URL**, **Support URL**, **Privacy Policy URL**. These must resolve to live pages at submission time.
- ⏳ App Privacy questionnaire — mirror the disclosures already in `mobile/PrivacyInfo.xcprivacy` (email, name, user ID, usage data, crash data; tracking: no).
- ⏳ Reviewer notes: provide the seeded test login (`alice@test.com / Alice123!`) and a one-paragraph explanation of the booking flow so the reviewer doesn't get stuck behind the auth wall.

---

## Summary

| Area | Status | Severity |
|------|--------|----------|
| IAP for digital goods | Missing | **Critical** |
| Account deletion | Missing | **Critical** |
| Privacy policy link | Missing | **High** |
| Privacy manifest | Missing | **High** |
| Build number | Missing | **High** |
| Apple Sign-In | Not required (yet) | Low |
| Permission strings | None needed currently | OK |
| Push notifications | Not implemented | OK |
| UGC moderation | N/A | OK |

Recommend tackling in order: **A → B → C → D**, then re-audit before TestFlight.
