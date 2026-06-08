import * as functions from 'firebase-functions';
import { FieldValue, Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from '../init';

const BATCH_SIZE = 400;

function toDate(value: unknown): Date {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    return new Date(value as string | number);
}

function getClassEnd(dateValue: unknown, startTime: unknown, durationMinutes: unknown): Date | null {
    const classDate = toDate(dateValue);
    if (Number.isNaN(classDate.getTime())) return null;

    const [hh, mm] = typeof startTime === 'string'
        ? startTime.split(':').map((part) => parseInt(part, 10))
        : [0, 0];
    const duration = typeof durationMinutes === 'number' && durationMinutes > 0
        ? durationMinutes
        : 60;

    classDate.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
    return new Date(classDate.getTime() + duration * 60 * 1000);
}

/**
 * Marks confirmed bookings as no-show after the class has ended.
 *
 * Members can still self check-in until class end time. After that, this job
 * moves any remaining confirmed booking to no-show so dashboards and history
 * do not show stale active bookings.
 */
export const markNoShows = functions.pubsub
    .schedule('every 15 minutes')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        const now = new Date();
        let checkedCount = 0;
        let noShowCount = 0;
        let lastDoc: QueryDocumentSnapshot | null = null;

        while (true) {
            let query = db
                .collection('bookings')
                .where('status', '==', 'confirmed')
                .where('classDate', '<=', now)
                .orderBy('classDate', 'desc')
                .limit(BATCH_SIZE);

            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();

            if (snapshot.empty) break;
            lastDoc = snapshot.docs[snapshot.docs.length - 1];

            const classIds = Array.from(new Set(
                snapshot.docs
                    .map((doc) => doc.data().classId)
                    .filter((classId): classId is string => typeof classId === 'string' && classId.length > 0),
            ));
            const classRefs = classIds.map((classId) => db.collection('classes').doc(classId));
            const classDocs = classRefs.length > 0 ? await db.getAll(...classRefs) : [];
            const classById = new Map(classDocs.map((doc) => [doc.id, doc]));

            const batch = db.batch();
            let writes = 0;

            for (const bookingDoc of snapshot.docs) {
                checkedCount += 1;
                const booking = bookingDoc.data();
                const classDoc = classById.get(booking.classId);
                if (!classDoc?.exists) continue;

                const classData = classDoc.data();
                const classEnd = getClassEnd(
                    classData?.date ?? booking.classDate,
                    classData?.startTime,
                    classData?.duration,
                );
                if (!classEnd || classEnd > now) continue;

                batch.update(bookingDoc.ref, {
                    status: 'no-show',
                    noShowAt: FieldValue.serverTimestamp(),
                    checkedInBy: 'system',
                    noShowReason: 'Auto-marked after class end time',
                    updatedAt: FieldValue.serverTimestamp(),
                });
                writes += 1;
                noShowCount += 1;
            }

            if (writes > 0) {
                await batch.commit();
            }

            if (snapshot.size < BATCH_SIZE) break;
        }

        console.log(
            `[markNoShows] checked=${checkedCount}, markedNoShow=${noShowCount}, checkedAt=${now.toISOString()}`,
        );

        return null;
    });
