# Razorpay Subscriptions Migration Design

## Status

Implemented in app code.

Current implementation:

- Web and mobile membership checkout use Razorpay Subscriptions.
- Intro Class remains a one-time Razorpay Order.
- Active Intro members can start a membership subscription.
- Active Razorpay membership members update the existing subscription instead of creating a duplicate checkout.
- Higher/equal price plan changes apply immediately through Razorpay subscription update.
- Lower price plan changes are scheduled for cycle end.
- Razorpay webhooks are idempotent and are the long-term billing sync source.
- Pull sync is available at `/api/subscriptions/sync` for repair/reconciliation.

## Goals

- Move recurring membership billing from one-time Razorpay Orders to Razorpay Subscriptions.
- Keep Sol Pilates plan selection, upgrade, cancel, and membership management inside our own web and mobile UI.
- Use Razorpay as the billing source of truth for recurring charges, retries, invoices, cancellations, and subscription lifecycle events.
- Keep Intro Class as a one-time paid onboarding purchase.
- Support branded Sol Pilates customer emails where Razorpay emails are not enough.
- Preserve booking rules such as weekly caps, class credits, subscription validity, and Intro Class-only restrictions.

## Non-Goals

- Do not move Intro Class to Razorpay Subscriptions.
- Do not build full proration accounting ourselves if Razorpay can own subscription updates.
- Do not use Razorpay-hosted plan selection as the primary user experience.
- Do not migrate every existing member to Razorpay Subscriptions on day one unless business volume requires it.

## Current State

Membership checkout now uses Razorpay Subscriptions:

- Web subscribe page calls `callCreateRazorpaySubscription()`.
- Mobile subscribe page calls `callCreateRazorpaySubscription()`.
- Razorpay Checkout opens with `subscription_id`.
- `/api/payments/verify-subscription` verifies the subscription checkout payment and activates local access.
- `/api/webhooks/razorpay` handles renewals, plan changes, halted state, cancellations, and payment failures.

One-time checkout still uses Razorpay Orders:

- Intro Class and non-recurring packs call `callCreatePaymentOrder()`.
- `/api/payments/verify` verifies one-time order payments.

Email status today:

- `functions/src/templates/emailTemplates.ts` has basic templates.
- `functions/src/triggers/sendBookingConfirmation.ts` renders a booking email but only logs it.
- No production email provider is currently wired for branded Sol emails.

## Recommended Product Model

### Intro Class

Keep Intro Class as a one-time Razorpay Order.

Reasoning:

- It is a single paid session.
- It does not renew.
- It acts as onboarding into membership.
- It should not create a recurring mandate.

### Memberships

Move these plans to Razorpay Subscriptions:

- `twice_quarterly`
- `twice_6mo`
- `thrice_quarterly`
- `thrice_6mo`

These are recurring or renewal-like products and are a better fit for Razorpay Subscriptions.

### Kickstarter

Decision needed.

Options:

- Keep as one-time Order if it is a short starter pack.
- Move to Subscription only if the business wants it to auto-renew.

Recommendation: keep `kickstarter` as one-time Order unless it becomes an auto-renewing product.

## User Experience

### Plan Selection

Keep our plan cards and membership UI.

Flow:

1. User selects a plan in our UI.
2. Backend creates or updates a Razorpay subscription.
3. App opens Razorpay Checkout for authorization/payment.
4. User returns to our success screen.
5. Webhook confirms ongoing billing state.

Razorpay UI should only appear for payment authorization, not plan browsing.

### New Membership Purchase

No active membership:

- User selects membership.
- App calls `/api/payments/create-subscription`.
- Backend creates Razorpay subscription.
- App opens Razorpay Checkout with `subscription_id`.
- App verifies payment through `/api/payments/verify-subscription`.
- Firestore subscription becomes active.

### Intro to Membership

Current plan is `drop_in`:

- Allow membership purchase anytime.
- Create a new Razorpay subscription.
- On successful activation, replace the local `drop_in` plan with the membership.
- Preserve unused `introCreditRemaining`.
- Membership credits and intro credits remain separate buckets.

Intro credit policy:

- Paying for Intro Class grants `introCreditRemaining = 1`.
- Intro Class payment should not add to normal `classesRemaining`.
- Booking an `Intro Class` consumes `introCreditRemaining`.
- Booking a normal class consumes membership `classesRemaining`.
- `introCreditRemaining` is the only source of truth for intro credits; do not infer intro credits from `classesRemaining`.
- If a member upgrades before using Intro Class, keep `introCreditRemaining = 1`.
- If the intro credit is already used, keep `introCreditRemaining = 0`.
- Canceling an Intro Class booking restores `introCreditRemaining`.

### Kickstarter to Membership

Current plan is `kickstarter`:

- Allow membership purchase anytime.
- Create a new Razorpay subscription.
- On successful activation, replace the local `kickstarter` plan with the membership.
- Carry unused Kickstarter `classesRemaining` into the first membership balance once.
- Store `kickstarterCreditsCarriedForward = true` and `carriedForwardCredits` for audit/debugging.
- Do not carry Kickstarter credits again on renewal, webhook replay, or pull sync.

Example:

- Kickstarter has `classesRemaining = 3`.
- User buys `twice_quarterly`, which grants 24 credits.
- First membership balance becomes 27 credits.
- Next renewal resets to the plan credits, 24.

### Membership Upgrade

Current plan is active membership:

- Same plan: block and show `Current Plan`.
- Higher or equal price plan: update existing Razorpay subscription immediately.
- Lower price plan: schedule change at end of current billing cycle.
- Renewal already canceled: block plan changes until the current paid period ends.

Immediate upgrade:

- Use Razorpay subscription update API.
- Let Razorpay calculate extra charge or credit behavior.
- Preserve unused credits from the current plan by adding the credit delta between the target plan and current plan.
- Update Firestore after successful API response.
- Webhook later reconciles the same state idempotently without overwriting the app-calculated credit balance.

Example:

- Current plan grants 24 credits.
- User has 10 credits remaining.
- Target plan grants 36 credits.
- New balance becomes `10 + (36 - 24) = 22`.

End-of-cycle switch:

- Use Razorpay scheduled update at end of cycle.
- Store pending change in Firestore.
- Pending-change cancellation is future work.

Canceled-renewal upgrade policy:

- After a user cancels renewal, local state remains `status = active`, `autoRenew = false`, and `cancelAtPeriodEnd = true` until `endDate`.
- Do not allow membership upgrades/downgrades while `cancelAtPeriodEnd = true`.
- The user keeps access until `endDate`, then can choose a new membership normally.
- Future work: add an explicit `Reactivate Renewal` / `Resume Membership` flow. Once reactivated in Razorpay and Firestore, upgrades can be enabled again.

Razorpay docs say subscriptions can be updated for plan, quantity, start date, and total count, either immediately or at end of cycle. Immediate updates may create prorated charge/refund behavior. End-of-cycle updates avoid mid-cycle adjustment.

Reference: https://razorpay.com/docs/payments/subscriptions/update/?preferred-country=US

### Cancellation

Cancel plan from our UI.

Membership behavior:

- Cancel at period end.
- User keeps access until current period end.
- `subscription.cancelAtPeriodEnd = true`.
- Daily expiry job changes status to `canceled` at end date.

Class pack behavior:

- `drop_in` and `kickstarter` do not auto-renew.
- Do not expose a member-facing cancel action for class packs.
- Paid credits remain usable until the plan expires.
- Backend cancellation rejects non-renewing plans instead of wiping paid credits.

Immediate membership cancellation should be admin-only unless business explicitly wants member self-service immediate cancellation.

## Backend Architecture

### APIs

#### Create Subscription

`POST /api/payments/create-subscription`

Use for new memberships and Intro to membership.

Rules:

- Reject non-membership plans.
- Allow if current subscription is inactive, expired, canceled, or `drop_in`.
- Reject active membership unless caller is using `/api/subscriptions/update`.
- Require mapped Razorpay Plan ID.
- For eligible founding members, require and use the mapped founding Razorpay Plan variant.
- Create Razorpay subscription with `customer_notify`.
- Store pending payment record.

Response:

```json
{
  "subscriptionId": "sub_...",
  "paymentId": "firestore-payment-id",
  "amount": 3600000,
  "currency": "INR",
  "key": "rzp_..."
}
```

#### Verify Subscription

`POST /api/payments/verify-subscription`

Rules:

- Verify Razorpay signature using `subscription_id|payment_id`.
- Mark payment as succeeded.
- Activate user subscription.
- Store `razorpaySubscriptionId`.
- Store `razorpayPlanId`.
- Preserve `introCreditRemaining`.

#### Abandon Subscription Checkout

`POST /api/payments/abandon-subscription`

Use when Razorpay Checkout is dismissed or fails before subscription verification.

Rules:

- Require `paymentId` and `subscriptionId`.
- Verify the pending payment belongs to the current user.
- Cancel the Razorpay subscription immediately.
- Mark the local payment as `abandoned`.
- Do not touch the member's active subscription state.

#### Update Subscription

`POST /api/subscriptions/update`

Purpose:

- Update an active Razorpay membership in place.

Rules:

- Reject non-membership target plans.
- Reject same-plan updates.
- Require existing `razorpaySubscriptionId`.
- Require target Razorpay Plan mapping.
- For eligible founding members, require and use the target founding Razorpay Plan variant.
- Compare current and target synced prices using the member's pricing variant.
- Apply higher/equal price plans immediately with `schedule_change_at = now`.
- Schedule lower price plans with `schedule_change_at = cycle_end`.
- Store pending plan fields when Razorpay schedules the change.

Response:

```json
{
  "success": true,
  "mode": "immediate",
  "planId": "thrice_quarterly",
  "planName": "3x Weekly · Quarterly",
  "effectiveAt": "2026-06-08T12:00:00.000Z",
  "endDate": "2026-09-06T12:00:00.000Z"
}
```

#### Pull Sync

`POST /api/subscriptions/sync`

Purpose:

- Repair local Firestore from Razorpay if a webhook is delayed or missed.

Rules:

- Fetch current Razorpay subscription.
- Map Razorpay `plan_id` to app `planId`.
- Sync local status, plan, period dates, pending update fields, and Razorpay ids.
- Reset credits only when Razorpay shows a newer billing period than Firestore already has.

### Razorpay Helper Additions

Add helpers in `shared/src/payments/razorpay-processor.ts`:

```ts
createRazorpaySubscription(razorpayPlanId, totalCount, keyId, keySecret, notes)

updateRazorpaySubscription(subscriptionId, razorpayPlanId, keyId, keySecret, {
  remainingCount,
  scheduleChangeAt: 'now' | 'cycle_end',
  customerNotify,
})

fetchRazorpaySubscription(subscriptionId, keyId, keySecret)
```

Pending-update fetch and cancel helpers are not implemented yet.

## Firestore Data Model

Extend `users/{uid}.subscription`:

```ts
subscription: {
  planId: PlanId | null;
  planCategory: 'membership' | 'class_pack' | null;
  status: 'active' | 'expired' | 'canceled' | 'halted' | 'pending';
  razorpaySubscriptionId: string | null;
  razorpayPlanId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  classesRemaining: number | null;
  introCreditRemaining: number;
  weeklyClassLimit: number;
  maxClassesPerDay: number;
  guestPassesRemaining: number;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  pendingPlanId?: PlanId | null;
  pendingRazorpayPlanId?: string | null;
  pendingPlanEffectiveAt?: Date | null;
  lastSyncedAt?: Date | null;
}
```

Add collection:

```txt
razorpayWebhookEvents/{eventId}
subscriptionChanges/{changeId}
```

`subscriptionChanges` fields:

- `userId`
- `razorpaySubscriptionId`
- `fromPlanId`
- `toPlanId`
- `razorpayPlanId`
- `scheduleChangeAt`
- `status`
- `effectiveAt`
- `requestedAt`
- `source`

`razorpayWebhookEvents` fields:

- `event`
- `receivedAt`
- `processedAt`
- `status`
- `error`

Use this for audit and debugging.

## Webhook Handling

Current webhook route handles:

- `subscription.activated`
- `subscription.charged`
- `invoice.paid`
- `subscription.updated`
- `subscription.halted`
- `subscription.cancelled`
- `subscription.completed`
- `payment.failed`

Webhook rules:

- Verify signature against raw request body.
- Make handlers idempotent with `razorpayWebhookEvents`.
- Store processed event IDs when Razorpay provides one, with a deterministic fallback key.
- Never trust client verification alone for long-term subscription state.
- Use webhooks to reconcile payment retries, halted state, cancellation, and renewal.

Renewal behavior:

- On recurring charge success, reset the new cycle:
  - `status = active`
  - `classesRemaining = plan.credits`
  - preserve `introCreditRemaining`
  - `weeklyClassLimit = plan.weeklyClassLimit`
  - `endDate`
- Write a payment/subscription event.

Failure behavior:

- On failed payment, record failure and show a warning state.
- Let Razorpay retry.
- If Razorpay marks subscription halted, block booking or show limited grace based on business decision.

## Email Strategy

### Razorpay Billing Emails

Razorpay Subscriptions supports email and SMS notifications for subscription lifecycle events, including subscription start, successful charges, payment failure, card update, halted state, cancellation, and subscription updates.

Reference: https://razorpay.com/docs/payments/subscriptions/notifications/?preferred-country=US

Use Razorpay emails for billing-critical events:

- Authentication/payment link
- Recurring payment success
- Recurring payment failure
- Card update required
- Subscription halted
- Subscription canceled
- Subscription updated

These emails are useful because Razorpay owns the payment method and retry lifecycle.

### Branded Sol Emails

Use our own email provider for product and studio experience emails:

- Welcome email
- Membership activated
- Upgrade confirmed
- Scheduled plan switch confirmed
- Cancel-at-period-end confirmed
- Intro Class paid, choose a session
- Booking confirmation
- Class reminder
- Class canceled
- Plan expiring soon

Recommended provider options:

- Resend
- SendGrid
- Mailgun
- Firebase Trigger Email extension

Recommendation: Resend or SendGrid for easiest branded transactional email control.

### Branding Requirements

Branded emails should use:

- Sol Pilates logo
- Terra accent `#FF6A3D`
- Warm light background
- Clear CTA buttons back to web app
- Facility address from Firestore
- Support email from facility settings

Example branded email events:

```ts
sendMembershipActivatedEmail({
  userId,
  planName,
  credits,
  currentPeriodEnd,
  scheduleUrl,
})

sendUpgradeConfirmedEmail({
  userId,
  previousPlanName,
  newPlanName,
  effectiveAt,
})

sendPaymentIssueEmail({
  userId,
  planName,
  managePaymentUrl,
})
```

### Avoid Duplicate Emails

If Razorpay sends billing email and Sol sends branded email, avoid duplicating the exact same message.

Suggested split:

- Razorpay: payment/billing/legal lifecycle.
- Sol: membership experience and next action.

Example:

- Razorpay sends payment receipt.
- Sol sends “Your 2x Weekly plan is active. Book your first class.”

## Pricing and Plan Sync

Keep the existing pull-based pricing sync:

- `/api/subscriptions/pricing`
- `settings/razorpayPlans`
- Match standard Razorpay Plans by `notes.fitconnect_plan_id`.
- Match founding-member Razorpay Plans by both `notes.fitconnect_plan_id` and `notes.fitconnect_variant = founding`.

Before subscription migration:

- Ensure every recurring membership plan exists in Razorpay Plans.
- Ensure every Razorpay Plan has `notes.fitconnect_plan_id`.
- Ensure every recurring membership with a founding price has a separate Razorpay Plan with `notes.fitconnect_variant = founding`.
- Ensure static fallback prices match Razorpay.

Checkout should fail closed if a membership has no Razorpay Plan ID. Founding-member checkout should also fail closed if the matching founding Razorpay Plan is missing, so founding members are not charged the standard rate by accident.

## Migration Plan

### Phase 0: Preparation

- Confirm Razorpay Subscriptions is enabled on the account.
- Create Razorpay Plans for all recurring memberships.
- Create founding Razorpay Plans for all recurring memberships with a founding price using `npx tsx scripts/create-razorpay-founding-plans.ts`.
- Add `fitconnect_plan_id` notes to every plan.
- Add `fitconnect_variant=founding` notes to founding plan variants.
- Test `/api/subscriptions/pricing` sync.
- Configure webhook URL and secret.
- Decide branded email provider.

### Phase 1: Backend Subscription Checkout

- Harden `/api/payments/create-subscription`.
- Harden `/api/payments/verify-subscription`.
- Add client wrappers:
  - `callCreateRazorpaySubscription`
  - `callVerifyRazorpaySubscription`
- Keep Orders for Intro Class and one-time packs.

### Phase 2: Web UI

- Wire web subscribe page membership checkout to Razorpay subscription path.
- Keep Intro Class using order path.
- Show current subscription management card.
- Show subscription-specific success and failure states.

### Phase 3: Mobile UI

- Wire mobile subscribe screen to Razorpay subscription path.
- Use Razorpay Checkout with `subscription_id`.
- Match web upgrade/cancel language.

### Phase 4: Webhook Reconciliation

- Implemented subscription activation, charge, update, halted, cancelled, completed, invoice paid, and payment failed handlers.
- Implemented webhook idempotency.
- Added `razorpayWebhookEvents` processing logs.
- Added `paymentFailures` logging.

### Phase 5: Plan Changes

- Implemented active membership update endpoint.
- Implemented immediate higher/equal price changes.
- Implemented end-of-cycle lower price changes.
- Pending-change cancellation is future work.

### Phase 6: Branded Emails

- Add email provider.
- Replace log-only booking confirmation with real sending.
- Add subscription email triggers.
- Keep Razorpay billing emails enabled for payment-critical messages.

### Phase 7: Existing Member Migration

Recommended default:

- Existing app-managed subscriptions continue until expiry.
- Renewals/new purchases use Razorpay Subscriptions.

Manual migration option:

- Create Razorpay subscription for each active member.
- Attach `razorpaySubscriptionId`.
- Set `billingProvider = 'razorpay'`.

Manual migration is only worth it if there are already many active paid members.

## Testing Matrix

### New Purchase

- No plan → 2x membership subscription.
- Payment success activates subscription.
- Checkout dismiss/failure abandons the pending Razorpay subscription.
- Webhook renewal resets credits.
- Payment failure logs failure.

### Intro Upgrade

- `drop_in` active → membership allowed.
- Membership replaces intro plan.
- Unused `introCreditRemaining` is preserved.
- Intro Class booking consumes only `introCreditRemaining`.
- Normal class booking consumes only membership `classesRemaining`.
- Normal classes become bookable.
- Intro-only plan restrictions no longer apply to normal classes after membership activation.

### Kickstarter Upgrade

- `kickstarter` active → membership allowed.
- Membership replaces starter pack.
- Unused Kickstarter class credits carry into the first membership cycle once.
- Webhook activation must not double-add carried credits after client verification.
- Renewals reset to normal plan credits only.

### Active Membership Upgrade

- 2x → 3x immediate upgrade.
- Immediate upgrades carry remaining credits plus the target/current plan credit delta.
- Same plan blocked.
- 3x → 2x scheduled at cycle end.
- Pending scheduled change is stored in Firestore.
- Pending scheduled change cancellation is future work.
- If renewal was canceled (`cancelAtPeriodEnd = true`), upgrade/downgrade is blocked until the current paid period ends.
- Future work: implement `Reactivate Renewal` before allowing upgrades after cancellation.

### Cancellation

- Membership: cancel at period end.
- Membership: user retains access until end date.
- Membership: UI shows `Renewal Canceled` and `Active Until`.
- Membership: Sync and webhooks must preserve `cancelAtPeriodEnd = true` while the current paid period is still usable.
- Membership: daily expiry job changes status after end date.
- Membership: Razorpay cancellation webhook does not prematurely remove access.
- Class pack: no member-facing cancellation; credits remain usable until expiry.

### Emails

- Razorpay billing email is sent for subscription lifecycle.
- Sol membership activated email is sent once.
- Payment failure does not create duplicate/conflicting messages.

## Risks

- Razorpay subscription update behavior can differ by payment method and account settings.
- Immediate upgrades can involve prorated charge or refund behavior in Razorpay that needs clear UX copy.
- Webhook retries require idempotency to avoid duplicate credits or emails.
- Sync/webhooks must not clear `cancelAtPeriodEnd` for cycle-end cancellations while Razorpay still reports the subscription as active.
- Existing one-time order code must remain for Intro Class.
- If Razorpay billing emails are enabled and Sol emails are also enabled, customers may receive too many messages unless responsibilities are split.

## Open Decisions

- Should `kickstarter` remain one-time, or become recurring?
- Should halted subscriptions immediately block booking, or allow grace period?
- Should we add a `Reactivate Renewal` flow for users who canceled renewal but later want to upgrade before `endDate`?
- Which branded email provider should we use?
- Should existing active members be manually migrated or allowed to expire naturally?

## External References

- Razorpay Subscriptions overview: https://razorpay.com/docs/payments/subscriptions/?locale=en-US
- Razorpay Subscriptions API: https://razorpay.com/docs/api/payments/subscriptions
- Razorpay subscription update docs: https://razorpay.com/docs/payments/subscriptions/update/?preferred-country=US
- Razorpay subscription notifications: https://razorpay.com/docs/payments/subscriptions/notifications/?preferred-country=US
