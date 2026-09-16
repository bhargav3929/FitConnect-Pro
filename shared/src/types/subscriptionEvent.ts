/**
 * One row of the append-only `subscriptionEvents` ledger.
 *
 * Every code path that changes `users/{uid}.subscription` writes one of these
 * in the same transaction, so the ledger answers "why does this member have
 * the plan and credits they have" without reading logs.
 */

export type SubscriptionEventSource =
    | 'checkout-callback'   // member's app called /api/payments/verify* after Razorpay checkout
    | 'webhook'             // Razorpay webhook
    | 'admin'               // an admin action in the dashboard
    | 'member'              // the member's own action (booking, cancel, plan change)
    | 'scheduled'           // a scheduled Cloud Function
    | 'auth-trigger'        // the onUserCreate Cloud Function
    | 'audit';              // the daily payment-grant audit

export type SubscriptionEventAction =
    | 'plan-granted'
    | 'plan-renewed'
    | 'plan-changed'
    | 'plan-change-scheduled'
    | 'plan-synced'
    | 'plan-canceled'
    | 'plan-expired'
    | 'plan-halted'
    | 'credit-consumed'
    | 'credit-restored'
    | 'profile-created'
    | 'profile-repaired'
    | 'grant-rejected'
    | 'audit-mismatch';

export interface SubscriptionEvent {
    id: string;
    userId: string;
    action: SubscriptionEventAction;
    source: SubscriptionEventSource;
    /** Human readable explanation an admin can act on. */
    reason: string;
    /** uid of the admin or member who caused it, null for system. */
    actorId: string | null;
    paymentId: string | null;
    razorpayPaymentId: string | null;
    razorpayOrderId: string | null;
    razorpaySubscriptionId: string | null;
    webhookEventId: string | null;
    bookingId: string | null;
    classId: string | null;
    /** Snapshot of `subscription` before the write, when the writer had one. */
    before: Record<string, unknown> | null;
    /** Subscription fields written, keyed without the `subscription.` prefix. */
    changes: Record<string, unknown>;
    metadata: Record<string, unknown>;
    createdAt: Date | string;
}
