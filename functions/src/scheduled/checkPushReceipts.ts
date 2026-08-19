import * as functions from 'firebase-functions';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../init';
import { getExpoPushReceipts, isUnrecoverable } from '../push/expo';

/** Expo needs a few minutes before a receipt is available. */
const MIN_TICKET_AGE_MS = 15 * 60 * 1000;

/** Expo keeps receipts for 24h; anything older will never resolve. */
const MAX_TICKET_AGE_MS = 24 * 60 * 60 * 1000;

const TICKET_LIMIT = 1000;
const BATCH_LIMIT = 400;

/**
 * Reconciles Expo delivery receipts and prunes tokens that will never deliver.
 *
 * A push ticket only says Expo accepted the message. The receipt, available a
 * few minutes later, is what reveals an uninstalled app or a revoked APNs/FCM
 * registration - the main way this collection would otherwise rot.
 */
export const checkPushReceipts = functions.pubsub
    .schedule('every 30 minutes')
    .onRun(async () => {
        const now = Date.now();
        const readyBefore = Timestamp.fromMillis(now - MIN_TICKET_AGE_MS);

        const ticketsSnapshot = await db
            .collection('pushTickets')
            .where('createdAt', '<=', readyBefore)
            .orderBy('createdAt', 'asc')
            .limit(TICKET_LIMIT)
            .get();

        if (ticketsSnapshot.empty) {
            console.log('[checkPushReceipts] no tickets ready');
            return null;
        }

        const tickets = ticketsSnapshot.docs.map((doc) => ({
            ref: doc.ref,
            id: doc.id,
            userId: doc.data().userId as string,
            tokenDocId: doc.data().tokenDocId as string,
            createdAt: (doc.data().createdAt as Timestamp | undefined)?.toMillis() ?? 0,
        }));

        const receipts = await getExpoPushReceipts(tickets.map((t) => t.id));

        // Deleting the same token twice is harmless, but de-duplicating keeps
        // the batch small when a member has several failed notifications.
        const deadTokens = new Set<string>();
        let delivered = 0;
        let errored = 0;
        let unresolved = 0;

        const resolvedTickets: typeof tickets = [];

        for (const ticket of tickets) {
            const receipt = receipts[ticket.id];

            if (!receipt) {
                // No receipt yet - retry next run, unless Expo has forgotten it.
                if (now - ticket.createdAt > MAX_TICKET_AGE_MS) {
                    resolvedTickets.push(ticket);
                } else {
                    unresolved += 1;
                }
                continue;
            }

            resolvedTickets.push(ticket);

            if (receipt.status === 'ok') {
                delivered += 1;
                continue;
            }

            errored += 1;
            if (isUnrecoverable(receipt.details?.error)) {
                deadTokens.add(`${ticket.userId}/${ticket.tokenDocId}`);
            } else {
                console.warn(`[checkPushReceipts] ${ticket.id}: ${receipt.message ?? 'unknown error'}`);
            }
        }

        // Clear resolved tickets and dead tokens together.
        const deletions = [
            ...resolvedTickets.map((t) => t.ref),
            ...Array.from(deadTokens).map((key) => {
                const [userId, tokenDocId] = key.split('/');
                return db.collection('users').doc(userId).collection('pushTokens').doc(tokenDocId);
            }),
        ];

        for (let i = 0; i < deletions.length; i += BATCH_LIMIT) {
            const batch = db.batch();
            for (const ref of deletions.slice(i, i + BATCH_LIMIT)) batch.delete(ref);
            await batch.commit();
        }

        console.log(
            `[checkPushReceipts] checked=${tickets.length} delivered=${delivered}`
            + ` errored=${errored} unresolved=${unresolved} tokensDropped=${deadTokens.size}`,
        );

        return null;
    });
