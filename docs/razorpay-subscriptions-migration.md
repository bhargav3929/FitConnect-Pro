# Razorpay Subscriptions Migration Design

## Status

Draft proposal. No implementation has been started from this document.

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

The active checkout flow uses Razorpay Orders:

- Web subscribe page calls `callCreatePaymentOrder()`.
- Mobile subscribe page calls `callCreatePaymentOrder()`.
- `/api/payments/create-order` creates a Razorpay order.
- `/api/payments/verify` verifies the order payment and updates `users/{uid}.subscription`.

There is partial Razorpay Subscriptions code already:

- `/api/payments/create-subscription`
- `/api/payments/verify-subscription`
- `createRazorpaySubscription(...)`
- `cancelRazorpaySubscription(...)`
- `/api/webhooks/razorpay`

But the web/mobile subscribe UI is not currently wired to the subscription checkout path.

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

### Membership Upgrade

Current plan is active membership:

- Same plan: block and show `Current Plan`.
- Higher plan: update existing Razorpay subscription.
- Lower plan: schedule change at end of current billing cycle.

Suggested rank:

```ts
const PLAN_RANK = {
  twice_quarterly: 20,
  twice_6mo: 25,
  thrice_quarterly: 30,
  thrice_6mo: 35,
};
```

Immediate upgrade:

- Use Razorpay subscription update API.
- Let Razorpay calculate extra charge or credit behavior.
- Update Firestore after webhook or successful API response.

End-of-cycle switch:

- Use Razorpay scheduled update at end of cycle.
- Store pending change in Firestore.
- Allow canceling pending change.

Razorpay docs say subscriptions can be updated for plan, quantity, start date, and total count, either immediately or at end of cycle. Immediate updates may create prorated charge/refund behavior. End-of-cycle updates avoid mid-cycle adjustment.

Reference: https://razorpay.com/docs/payments/subscriptions/update/?preferred-country=US

### Cancellation

Cancel membership from our UI.

Default behavior:

- Cancel at period end.
- User keeps access until current period end.
- `subscription.cancelAtPeriodEnd = true`.
- Daily expiry job changes status to `canceled` at end date.

Immediate cancellation should be admin-only unless business explicitly wants member self-service immediate cancellation.

## Backend Architecture

### APIs

#### Create Subscription

`POST /api/payments/create-subscription`

Use for new memberships and Intro to membership.

Rules:

- Reject non-membership plans.
- Allow if current subscription is inactive, expired, canceled, or `drop_in`.
- Reject active membership unless caller is using change-plan endpoint.
- Require mapped Razorpay Plan ID.
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
- Write a `subscriptionEvents` audit record.

#### Change Plan Preview

`POST /api/subscriptions/change-plan/preview`

Purpose:

- Return current plan, target plan, action, start timing, and expected billing behavior before opening payment or updating Razorpay.

Response:

```json
{
  "action": "upgrade_immediate",
  "currentPlanId": "twice_quarterly",
  "targetPlanId": "thrice_quarterly",
  "effectiveAt": "immediate",
  "billingNote": "Razorpay may charge or credit the prorated difference."
}
```

#### Change Plan Commit

`POST /api/subscriptions/change-plan`

Actions:

- `upgrade_immediate`
- `switch_end_of_cycle`
- `cancel_pending_change`

This route should own all active-membership plan changes.

### Razorpay Helper Additions

Add helpers in `shared/src/payments/razorpay-processor.ts`:

```ts
updateRazorpaySubscription(subscriptionId, {
  planId,
  totalCount,
  scheduleChangeAt: 'now' | 'cycle_end',
  customerNotify,
})

fetchRazorpaySubscriptionPendingUpdate(subscriptionId)

cancelRazorpaySubscriptionUpdate(subscriptionId)
```

Exact request fields should match Razorpay API requirements during implementation.

## Firestore Data Model

Extend `users/{uid}.subscription`:

```ts
subscription: {
  planId: PlanId | null;
  planCategory: 'membership' | 'class_pack' | null;
  status: 'active' | 'expired' | 'canceled' | 'halted' | 'pending';
  billingProvider: 'razorpay' | 'manual' | null;
  razorpaySubscriptionId: string | null;
  razorpayPlanId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  classesRemaining: number | null;
  introCreditRemaining: number;
  weeklyClassLimit: number;
  maxClassesPerDay: number;
  guestPassesRemaining: number;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  pendingPlanChange?: {
    targetPlanId: PlanId;
    razorpayPlanId: string;
    effectiveAt: Date;
    scheduleChangeAt: 'cycle_end';
    requestedAt: Date;
    status: 'scheduled';
  };
  previousPlan?: {
    planId: PlanId;
    status: string;
    replacedAt: Date;
    reason: 'intro_upgrade' | 'membership_upgrade' | 'admin_change';
  };
}
```

Add collection:

```txt
subscriptionEvents/{eventId}
```

Fields:

- `userId`
- `eventType`
- `source`
- `razorpaySubscriptionId`
- `razorpayPaymentId`
- `fromPlanId`
- `toPlanId`
- `effectiveAt`
- `rawWebhookEventId`
- `createdAt`

Use this for audit and debugging.

## Webhook Handling

Current webhook route already handles:

- `subscription.charged`
- `subscription.halted`
- `subscription.cancelled`
- `subscription.completed`
- `payment.failed`

Recommended additions:

- `subscription.activated`
- `subscription.pending`
- `subscription.authenticated`
- `subscription.updated` if available for account/event setup
- invoice/payment events needed to reconcile recurring charges

Webhook rules:

- Verify signature against raw request body.
- Make handlers idempotent.
- Store processed event IDs if Razorpay event ID is available.
- Never trust client verification alone for long-term subscription state.
- Use webhooks to reconcile payment retries, halted state, cancellation, and renewal.

Renewal behavior:

- On recurring charge success, reset the new cycle:
  - `status = active`
  - `classesRemaining = plan.credits`
  - preserve `introCreditRemaining`
  - `weeklyClassLimit = plan.weeklyClassLimit`
  - `currentPeriodStart/currentPeriodEnd`
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
- Match Razorpay Plans by `notes.fitconnect_plan_id`.

Before subscription migration:

- Ensure every recurring membership plan exists in Razorpay Plans.
- Ensure every Razorpay Plan has `notes.fitconnect_plan_id`.
- Ensure static fallback prices match Razorpay.

Checkout should fail closed if a membership has no Razorpay Plan ID.

## Migration Plan

### Phase 0: Preparation

- Confirm Razorpay Subscriptions is enabled on the account.
- Create Razorpay Plans for all recurring memberships.
- Add `fitconnect_plan_id` notes to every plan.
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

- Add missing subscription events.
- Add idempotency.
- Add `subscriptionEvents` audit logs.
- Add admin visibility for payment failures and halted subscriptions.

### Phase 5: Plan Changes

- Add change-plan preview endpoint.
- Add immediate upgrade support.
- Add end-of-cycle switch support.
- Add cancel pending change support.

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

### Active Membership Upgrade

- 2x → 3x immediate upgrade.
- Same plan blocked.
- 3x → 2x scheduled at cycle end.
- Pending scheduled change can be canceled.

### Cancellation

- Cancel at period end.
- User retains access until end date.
- Daily expiry job changes status after end date.
- Razorpay cancellation webhook does not prematurely remove access.

### Emails

- Razorpay billing email is sent for subscription lifecycle.
- Sol membership activated email is sent once.
- Payment failure does not create duplicate/conflicting messages.

## Risks

- Razorpay subscription update behavior can differ by payment method and account settings.
- Immediate upgrades can involve prorated charge or refund behavior that needs clear UX copy.
- Webhook retries require idempotency to avoid duplicate credits or emails.
- Existing one-time order code must remain for Intro Class.
- If Razorpay billing emails are enabled and Sol emails are also enabled, customers may receive too many messages unless responsibilities are split.

## Open Decisions

- Should `kickstarter` remain one-time, or become recurring?
- Should halted subscriptions immediately block booking, or allow grace period?
- Should immediate upgrades preserve unused credits from the old plan?
- Should downgrades always happen end-of-cycle?
- Which branded email provider should we use?
- Should existing active members be manually migrated or allowed to expire naturally?

## External References

- Razorpay Subscriptions overview: https://razorpay.com/docs/payments/subscriptions/?locale=en-US
- Razorpay Subscriptions API: https://razorpay.com/docs/api/payments/subscriptions
- Razorpay subscription update docs: https://razorpay.com/docs/payments/subscriptions/update/?preferred-country=US
- Razorpay subscription notifications: https://razorpay.com/docs/payments/subscriptions/notifications/?preferred-country=US
