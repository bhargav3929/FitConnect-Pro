import { FieldValue, type Transaction, type WriteBatch } from 'firebase-admin/firestore';
import { db } from '../init';

/**
 * Append-only ledger of every change to a member's subscription.
 * Mirrors src/lib/subscription-events.ts in the web app; the shape is defined
 * in shared/src/types/subscriptionEvent.ts. Keep the two helpers identical.
 */

export type SubscriptionEventSource =
    | 'checkout-callback' | 'webhook' | 'admin' | 'member' | 'scheduled' | 'auth-trigger' | 'audit';

export type SubscriptionEventAction =
    | 'plan-granted' | 'plan-renewed' | 'plan-changed' | 'plan-change-scheduled' | 'plan-synced'
    | 'plan-canceled' | 'plan-expired' | 'plan-halted' | 'plan-frozen' | 'plan-unfrozen' | 'plan-adjusted'
    | 'cancel-scheduled' | 'credit-consumed' | 'credit-restored'
    | 'profile-created' | 'profile-repaired' | 'grant-rejected' | 'audit-mismatch';

export interface SubscriptionEventInput {
    userId: string;
    action: SubscriptionEventAction;
    source: SubscriptionEventSource;
    reason: string;
    actorId?: string | null;
    paymentId?: string | null;
    razorpayPaymentId?: string | null;
    razorpayOrderId?: string | null;
    razorpaySubscriptionId?: string | null;
    webhookEventId?: string | null;
    bookingId?: string | null;
    classId?: string | null;
    before?: Record<string, unknown> | null;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

const SUBSCRIPTION_PREFIX = 'subscription.';

export function subscriptionChanges(update: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(update)) {
        if (key.startsWith(SUBSCRIPTION_PREFIX)) {
            out[key.slice(SUBSCRIPTION_PREFIX.length)] = value;
        } else if (key === 'subscription' && value && typeof value === 'object') {
            Object.assign(out, value as Record<string, unknown>);
        }
    }
    return out;
}

export function recordSubscriptionEvent(
    writer: Transaction | WriteBatch | null,
    input: SubscriptionEventInput,
): Promise<void> {
    const ref = db.collection('subscriptionEvents').doc();
    const data = {
        id: ref.id,
        userId: input.userId,
        action: input.action,
        source: input.source,
        reason: input.reason,
        actorId: input.actorId ?? null,
        paymentId: input.paymentId ?? null,
        razorpayPaymentId: input.razorpayPaymentId ?? null,
        razorpayOrderId: input.razorpayOrderId ?? null,
        razorpaySubscriptionId: input.razorpaySubscriptionId ?? null,
        webhookEventId: input.webhookEventId ?? null,
        bookingId: input.bookingId ?? null,
        classId: input.classId ?? null,
        before: input.before ?? null,
        changes: input.changes ?? {},
        metadata: input.metadata ?? {},
        createdAt: FieldValue.serverTimestamp(),
    };
    if (writer) {
        // Transaction and WriteBatch expose different `set` overloads, so narrow first.
        if ('get' in writer) (writer as Transaction).set(ref, data);
        else (writer as WriteBatch).set(ref, data);
        return Promise.resolve();
    }
    return ref.set(data).then(() => undefined);
}
