import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { recordSubscriptionEvent, subscriptionChanges } from '../lib/subscriptionEvents';
import { db } from '../init';

// Each member costs two writes (the user doc and its ledger row); Firestore
// batches allow 500.
const BATCH_SIZE = 240;

/**
 * Expires subscriptions whose access window has ended.
 *
 * The booking API also performs a lazy expiry check, but this daily job keeps
 * dashboards, filters, and member state accurate even when the member does not
 * attempt a new booking.
 */
export const expireSubscriptions = functions.pubsub
    .schedule('15 2 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const now = new Date();
        let expiredCount = 0;
        let canceledCount = 0;

        while (true) {
            const snapshot = await db
                .collection('users')
                .where('subscription.status', '==', 'active')
                .where('subscription.endDate', '<=', now)
                .orderBy('subscription.endDate', 'asc')
                .limit(BATCH_SIZE)
                .get();

            if (snapshot.empty) break;

            const batch = db.batch();

            for (const doc of snapshot.docs) {
                const subscription = doc.data().subscription as Record<string, unknown> | undefined;
                const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd === true;
                const nextStatus = cancelAtPeriodEnd ? 'canceled' : 'expired';

                if (nextStatus === 'canceled') canceledCount += 1;
                else expiredCount += 1;

                const userUpdate = {
                    'subscription.status': nextStatus,
                    'subscription.autoRenew': false,
                    'subscription.cancelAtPeriodEnd': false,
                    'subscription.expiredAt': FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                };
                batch.update(doc.ref, userUpdate);
                recordSubscriptionEvent(batch, {
                    userId: doc.id,
                    action: nextStatus === 'canceled' ? 'plan-canceled' : 'plan-expired',
                    source: 'scheduled',
                    reason: nextStatus === 'canceled'
                        ? 'Paid period ended after the member canceled renewal'
                        : `Plan end date passed (${String(subscription?.planId ?? 'unknown plan')})`,
                    razorpaySubscriptionId: typeof subscription?.razorpaySubscriptionId === 'string' ? subscription.razorpaySubscriptionId : null,
                    before: subscription ?? null,
                    changes: subscriptionChanges(userUpdate),
                    metadata: { job: 'expireSubscriptions' },
                });
            }

            await batch.commit();

            if (snapshot.size < BATCH_SIZE) break;
        }

        console.log(
            `[expireSubscriptions] expired=${expiredCount}, canceled=${canceledCount}, checkedAt=${now.toISOString()}`,
        );

        return null;
    });
