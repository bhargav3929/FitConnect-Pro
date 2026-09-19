import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../init';
import { recordSubscriptionEvent } from '../lib/subscriptionEvents';

/**
 * Safety net for late cancellations (see /policies#membership-cancellation).
 *
 * A member who cancels with less than 14 days' notice owes one more charge;
 * the Razorpay webhook stops renewal as soon as that charge lands. If that
 * Razorpay call failed, this daily job retries it, so the member is never
 * billed a second extra cycle.
 *
 * Configure in functions/.env (see functions/.env.example):
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   the same live keys the web app uses
 */

interface RazorpaySubscription {
    id: string;
    status: string;
    current_start?: number | null;
    cancel_at_cycle_end?: boolean;
}

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe.toDate === 'function') return maybe.toDate();
    const d = new Date(value as string | number);
    return Number.isNaN(d.getTime()) ? null : d;
}

async function razorpay<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured');
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
        method,
        headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Razorpay ${method} ${path} failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
}

export async function retryDueDeferredCancellations(): Promise<{ checked: number; canceled: number; failed: number }> {
    const pending = await db.collection('users').where('subscription.cancelAfterNextCharge', '==', true).get();
    let canceled = 0;
    let failed = 0;

    for (const doc of pending.docs) {
        const sub = doc.data().subscription as Record<string, unknown>;
        const subscriptionId = sub.razorpaySubscriptionId;
        const requestedAt = toDate(sub.cancelRequestedAt);
        if (typeof subscriptionId !== 'string' || !requestedAt) continue;

        try {
            const rzp = await razorpay<RazorpaySubscription>(`/subscriptions/${subscriptionId}`, 'GET');
            const cycleStart = typeof rzp.current_start === 'number' ? new Date(rzp.current_start * 1000) : null;
            const alreadyEnding = rzp.cancel_at_cycle_end === true || ['cancelled', 'completed', 'expired'].includes(rzp.status);
            // Still inside the cycle the member was told they owe notice for: wait.
            if (!alreadyEnding && (!cycleStart || cycleStart <= requestedAt)) continue;

            if (!alreadyEnding) {
                await razorpay(`/subscriptions/${subscriptionId}/cancel`, 'POST', { cancel_at_cycle_end: 1 });
            }
            const update = {
                'subscription.cancelAfterNextCharge': false,
                'subscription.cancelAtPeriodEnd': true,
                'subscription.autoRenew': false,
                'subscription.canceledAt': FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };
            const batch = db.batch();
            batch.update(doc.ref, update);
            recordSubscriptionEvent(batch, {
                userId: doc.id,
                action: 'plan-canceled',
                source: 'scheduled',
                reason: 'Late cancellation: owed cycle has been charged, renewal stopped at the end of it',
                razorpaySubscriptionId: subscriptionId,
                before: sub,
                changes: {
                    cancelAfterNextCharge: false,
                    cancelAtPeriodEnd: true,
                    autoRenew: false,
                },
                metadata: { job: 'retryDeferredCancellations', razorpayStatus: rzp.status },
            });
            await batch.commit();
            canceled += 1;
        } catch (error) {
            failed += 1;
            functions.logger.error('[retryDeferredCancellations] failed for user', doc.id, error);
        }
    }

    return { checked: pending.size, canceled, failed };
}

export const retryDeferredCancellations = functions.pubsub
    .schedule('30 3 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const result = await retryDueDeferredCancellations();
        functions.logger.info('[retryDeferredCancellations] done', result);
        return null;
    });
