import * as functions from 'firebase-functions';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../init';
import { isUnrecoverable, sendExpoPushes, type ExpoPushMessage } from '../push/expo';

/**
 * Android notification channel. Must match the channel the mobile app creates
 * in mobile/hooks/usePushNotifications.ts, or Android drops the notification.
 */
const ANDROID_CHANNEL_ID = 'default';

/**
 * A notification written far in the past is a backfill or a replay, not news.
 * Pushing it would wake members up about a class that already happened.
 */
const MAX_PUSH_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * Fans an in-app notification out to the member's devices as a push.
 *
 * Every producer - the class reminder job, the plan expiry job, and the admin
 * announcement route - writes to `notifications`, so mirroring that collection
 * is the single place push has to be wired up. Push is best-effort: the in-app
 * inbox is the source of truth and a failed send never fails the write.
 */
export const onNotificationCreated = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snapshot) => {
        const notification = snapshot.data();
        const userId = notification.userId;

        if (typeof userId !== 'string' || !userId) {
            console.warn(`[push] ${snapshot.id} has no userId, skipping`);
            return null;
        }

        const createdAt = notification.createdAt?.toDate?.() as Date | undefined;
        if (createdAt && Date.now() - createdAt.getTime() > MAX_PUSH_AGE_MS) {
            console.log(`[push] ${snapshot.id} is stale (${createdAt.toISOString()}), skipping`);
            return null;
        }

        const tokensSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('pushTokens')
            .get();

        if (tokensSnapshot.empty) {
            console.log(`[push] ${userId} has no registered devices`);
            return null;
        }

        const devices = tokensSnapshot.docs
            .map((doc) => ({ id: doc.id, token: doc.data().token as string }))
            .filter((device) => typeof device.token === 'string' && device.token.length > 0);

        const messages: ExpoPushMessage[] = devices.map((device) => ({
            to: device.token,
            title: String(notification.title ?? 'Sol Pilates'),
            body: String(notification.body ?? ''),
            sound: 'default',
            channelId: ANDROID_CHANNEL_ID,
            data: {
                notificationId: snapshot.id,
                type: notification.type ?? null,
                link: notification.link ?? null,
            },
        }));

        const tickets = await sendExpoPushes(messages);

        // Ticket IDs are checked for delivery receipts later; a ticket only
        // means Expo accepted the message, not that the device received it.
        const batch = db.batch();
        let pending = 0;
        let dropped = 0;
        let failed = 0;

        tickets.forEach((ticket, index) => {
            const device = devices[index];
            if (!device) return;

            if (ticket.status === 'ok' && ticket.id) {
                batch.set(db.collection('pushTickets').doc(ticket.id), {
                    ticketId: ticket.id,
                    userId,
                    tokenDocId: device.id,
                    notificationId: snapshot.id,
                    createdAt: FieldValue.serverTimestamp(),
                });
                pending += 1;
                return;
            }

            if (isUnrecoverable(ticket.details?.error)) {
                batch.delete(
                    db.collection('users').doc(userId).collection('pushTokens').doc(device.id),
                );
                dropped += 1;
                return;
            }

            failed += 1;
            console.warn(`[push] ${snapshot.id} → ${device.id}: ${ticket.message ?? 'unknown error'}`);
        });

        if (pending + dropped > 0) await batch.commit();

        console.log(
            `[push] ${snapshot.id} user=${userId} devices=${devices.length}`
            + ` pending=${pending} dropped=${dropped} failed=${failed}`,
        );

        return null;
    });
