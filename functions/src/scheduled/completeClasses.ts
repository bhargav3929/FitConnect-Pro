import * as functions from 'firebase-functions';
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from '../init';
import { getClassEnd } from './class-time';

const BATCH_SIZE = 400;

/**
 * Completes classes once their configured end time passes. Member-facing
 * schedule queries only include scheduled/ongoing classes, so this is the
 * durable server-side close in addition to the immediate client-side filter.
 */
export const completeClasses = functions.pubsub
    .schedule('every 15 minutes')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const now = new Date();
        let completed = 0;
        let lastDoc: QueryDocumentSnapshot | null = null;

        while (true) {
            let query = db.collection('classes')
                .where('status', 'in', ['scheduled', 'ongoing'])
                .where('date', '<=', now)
                .orderBy('date', 'asc')
                .limit(BATCH_SIZE);
            if (lastDoc) query = query.startAfter(lastDoc);

            const snapshot = await query.get();
            if (snapshot.empty) break;
            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            const batch = db.batch();
            let writes = 0;
            for (const classDoc of snapshot.docs) {
                const classData = classDoc.data();
                const classEnd = getClassEnd(classData.date, classData.startTime, classData.duration);
                if (!classEnd || classEnd > now) continue;

                batch.update(classDoc.ref, {
                    status: 'completed',
                    completedAt: FieldValue.serverTimestamp(),
                    completedBy: 'system',
                    updatedAt: FieldValue.serverTimestamp(),
                });
                writes += 1;
                completed += 1;
            }
            if (writes > 0) await batch.commit();
            if (snapshot.size < BATCH_SIZE) break;
        }

        console.log(`[completeClasses] completed=${completed}, checkedAt=${now.toISOString()}`);
        return null;
    });
