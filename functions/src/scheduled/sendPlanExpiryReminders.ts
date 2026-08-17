import * as functions from 'firebase-functions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../init';

const BATCH_LIMIT = 400;

/**
 * Mirrors PLAN_EXPIRY_REMINDER_DAYS and planExpiryId in
 * shared/src/types/notification.ts. The functions package builds standalone and
 * cannot resolve @fitconnect/shared, so both are duplicated here - keep in sync.
 */
const REMINDER_DAYS = [7, 3, 1];

function planExpiryId(userId: string, daysLeft: number): string {
    return `plan_expiry__${userId}__${daysLeft}`;
}

function toDate(value: unknown): Date | null {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

/** Whole days from the start of today to the start of the given date. */
function daysUntil(target: Date, from: Date): number {
    const a = new Date(from);
    a.setHours(0, 0, 0, 0);
    const b = new Date(target);
    b.setHours(0, 0, 0, 0);
    return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Warns members whose plan is about to lapse, at 7, 3 and 1 days out.
 *
 * One notification per member per threshold: the document ID encodes the
 * threshold, so the daily run only ever adds the milestones not yet sent.
 */
export const sendPlanExpiryReminders = functions.pubsub
    .schedule('30 9 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const now = new Date();
        const maxDays = Math.max(...REMINDER_DAYS);

        const horizon = new Date(now);
        horizon.setHours(0, 0, 0, 0);
        horizon.setDate(horizon.getDate() + maxDays);
        horizon.setHours(23, 59, 59, 999);

        const snapshot = await db
            .collection('users')
            .where('subscription.status', '==', 'active')
            .where('subscription.endDate', '<=', horizon)
            .get();

        if (snapshot.empty) {
            console.log('[sendPlanExpiryReminders] no plans nearing expiry');
            return null;
        }

        // Work out which (user, threshold) reminders are due before writing.
        const candidates: { userId: string; daysLeft: number; endDate: Date; credits: unknown }[] = [];

        for (const doc of snapshot.docs) {
            const subscription = doc.data().subscription as Record<string, unknown> | undefined;
            if (!subscription) continue;

            const endDate = toDate(subscription.endDate);
            if (!endDate) continue;

            const daysLeft = daysUntil(endDate, now);
            // Already lapsed plans are handled by expireSubscriptions.
            if (!REMINDER_DAYS.includes(daysLeft)) continue;

            candidates.push({
                userId: doc.id,
                daysLeft,
                endDate,
                credits: subscription.classesRemaining,
            });
        }

        if (candidates.length === 0) {
            console.log('[sendPlanExpiryReminders] no reminders due today');
            return null;
        }

        const refs = candidates.map((c) => db.collection('notifications').doc(planExpiryId(c.userId, c.daysLeft)));
        const existing = await db.getAll(...refs);
        const alreadySent = new Set(existing.filter((d) => d.exists).map((d) => d.id));

        const serverNow = FieldValue.serverTimestamp();
        let created = 0;

        for (let i = 0; i < candidates.length; i += BATCH_LIMIT) {
            const batch = db.batch();
            let writes = 0;

            for (const candidate of candidates.slice(i, i + BATCH_LIMIT)) {
                const id = planExpiryId(candidate.userId, candidate.daysLeft);
                if (alreadySent.has(id)) continue;

                const dayLabel = candidate.daysLeft === 1 ? 'tomorrow' : `in ${candidate.daysLeft} days`;
                const creditsLeft = typeof candidate.credits === 'number' ? candidate.credits : null;
                const creditSentence = creditsLeft !== null && creditsLeft > 0
                    ? ` You still have ${creditsLeft} class${creditsLeft === 1 ? '' : 'es'} left - book them before they go.`
                    : '';

                const ref = db.collection('notifications').doc(id);
                batch.set(ref, {
                    id,
                    userId: candidate.userId,
                    type: 'plan_expiry',
                    title: candidate.daysLeft === 1 ? 'Your plan expires tomorrow' : `Your plan expires in ${candidate.daysLeft} days`,
                    body: `Your plan ends on ${candidate.endDate.toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                    })} (${dayLabel}).${creditSentence}`,
                    read: false,
                    readAt: null,
                    link: '/user/subscribe',
                    createdAt: serverNow,
                });
                writes += 1;
                created += 1;
            }

            if (writes > 0) await batch.commit();
        }

        console.log(
            `[sendPlanExpiryReminders] candidates=${candidates.length}, created=${created}`,
        );

        return null;
    });
