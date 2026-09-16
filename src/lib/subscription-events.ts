import { FieldValue, type Transaction, type WriteBatch } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type { SubscriptionEventAction, SubscriptionEventSource } from '@fitconnect/shared/types/subscriptionEvent';

/**
 * Append-only ledger of every change to a member's subscription.
 *
 * Call inside the same transaction or batch that writes `users/{uid}` so the
 * ledger can never disagree with the document. Pass `null` as the writer to
 * commit standalone (only for writers that are not already in a transaction).
 */

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
    /** The `users` update payload, or an explicit map of subscription fields. */
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

const SUBSCRIPTION_PREFIX = 'subscription.';

/**
 * Turns a `users` update payload into a plain map of subscription fields.
 * Non-subscription keys are dropped. FieldValue sentinels (increments, server
 * timestamps) are kept: Firestore applies them when the event is written, which
 * is the value the member document receives.
 */
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

function buildEventData(input: SubscriptionEventInput, id: string) {
    return {
        id,
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
}

export function recordSubscriptionEvent(
    writer: Transaction | WriteBatch | null,
    input: SubscriptionEventInput,
): Promise<void> {
    const ref = adminDb.collection('subscriptionEvents').doc();
    const data = buildEventData(input, ref.id);
    if (writer) {
        // Transaction and WriteBatch expose different `set` overloads, so narrow first.
        if ('get' in writer) (writer as Transaction).set(ref, data);
        else (writer as WriteBatch).set(ref, data);
        return Promise.resolve();
    }
    return ref.set(data).then(() => undefined);
}
