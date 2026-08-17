import * as functions from 'firebase-functions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../init';

const BATCH_LIMIT = 400;

/**
 * Mirrors classReminderId in shared/src/types/notification.ts. The functions
 * package builds standalone and cannot resolve @fitconnect/shared, so the ID
 * scheme is duplicated here - keep the two in sync.
 */
function classReminderId(bookingId: string): string {
    return `class_reminder__${bookingId}`;
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

function formatTime(startTime: unknown): string {
    if (typeof startTime !== 'string') return '';
    const match = startTime.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '';
    const hours = Number(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${minutes} ${period}`;
}

/**
 * Reminds members about the classes they have booked for tomorrow.
 *
 * Runs each evening in studio time. Notification IDs are derived from the
 * booking ID, so a re-run overwrites the same document rather than sending a
 * member the same reminder twice.
 */
export const sendClassReminders = functions.pubsub
    .schedule('0 19 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async () => {
        // Tomorrow's window, in the studio's local day.
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + 1);

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        const bookingsSnapshot = await db
            .collection('bookings')
            .where('status', '==', 'confirmed')
            .where('classDate', '>=', start)
            .where('classDate', '<=', end)
            .get();

        if (bookingsSnapshot.empty) {
            console.log(`[sendClassReminders] no bookings for ${start.toDateString()}`);
            return null;
        }

        // Hydrate the class docs so the reminder can name the class and time.
        const classIds = Array.from(new Set(
            bookingsSnapshot.docs
                .map((d) => d.data().classId)
                .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ));
        const classDocs = classIds.length > 0
            ? await db.getAll(...classIds.map((id) => db.collection('classes').doc(id)))
            : [];
        const classById = new Map(classDocs.map((d) => [d.id, d.data()]));

        // Skip reminders that already exist rather than overwriting them - a
        // re-run must not flip a notification the member already read back to
        // unread.
        const reminderRefs = bookingsSnapshot.docs.map((d) =>
            db.collection('notifications').doc(classReminderId(d.id)),
        );
        const existingDocs = reminderRefs.length > 0 ? await db.getAll(...reminderRefs) : [];
        const alreadySent = new Set(existingDocs.filter((d) => d.exists).map((d) => d.id));

        const now = FieldValue.serverTimestamp();
        let created = 0;
        let skipped = 0;

        for (let i = 0; i < bookingsSnapshot.docs.length; i += BATCH_LIMIT) {
            const batch = db.batch();
            let writes = 0;

            for (const bookingDoc of bookingsSnapshot.docs.slice(i, i + BATCH_LIMIT)) {
                const booking = bookingDoc.data();
                const userId = booking.userId;
                if (typeof userId !== 'string' || !userId) {
                    skipped += 1;
                    continue;
                }

                if (alreadySent.has(classReminderId(bookingDoc.id))) {
                    skipped += 1;
                    continue;
                }

                const classData = classById.get(booking.classId);
                // A cancelled class should not produce a reminder.
                if (classData && classData.status !== 'scheduled') {
                    skipped += 1;
                    continue;
                }

                const classDate = toDate(classData?.date ?? booking.classDate);
                const classType = (classData?.classType as string) || 'your class';
                const time = formatTime(classData?.startTime);
                const location = (classData?.location as string) || '';

                const whenParts = [
                    classDate
                        ? classDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
                        : 'tomorrow',
                    time,
                ].filter(Boolean);

                const ref = db.collection('notifications').doc(classReminderId(bookingDoc.id));
                batch.set(ref, {
                    id: ref.id,
                    userId,
                    type: 'class_reminder',
                    title: `Reminder: ${classType} tomorrow`,
                    body: `You're booked for ${classType} on ${whenParts.join(' at ')}`
                        + `${location ? ` in ${location}` : ''}. Spot ${booking.spotNumber ?? '-'}.`,
                    read: false,
                    readAt: null,
                    link: '/user/bookings',
                    createdAt: now,
                });
                writes += 1;
                created += 1;
            }

            if (writes > 0) await batch.commit();
        }

        console.log(
            `[sendClassReminders] date=${start.toDateString()}, created=${created}, skipped=${skipped}`,
        );

        return null;
    });
