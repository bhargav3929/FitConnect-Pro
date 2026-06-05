import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../init';

const BATCH_SIZE = 450;

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

                batch.update(doc.ref, {
                    'subscription.status': nextStatus,
                    'subscription.autoRenew': false,
                    'subscription.cancelAtPeriodEnd': false,
                    'subscription.expiredAt': FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
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
