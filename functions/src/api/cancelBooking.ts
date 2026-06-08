import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

interface CancelBookingData {
    bookingId: string;
}

export const cancelBooking = functions.https.onCall(async (data: CancelBookingData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to cancel a booking');
    }

    const { bookingId } = data;
    const userId = context.auth.uid;

    if (!bookingId || typeof bookingId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'bookingId is required and must be a string');
    }

    const bookingRef = db.collection('bookings').doc(bookingId);

    try {
        await db.runTransaction(async (transaction) => {
            const bookingDoc = await transaction.get(bookingRef);

            if (!bookingDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Booking not found');
            }

            const bookingData = bookingDoc.data()!;

            // Validate ownership
            if (bookingData.userId !== userId) {
                throw new functions.https.HttpsError(
                    'permission-denied',
                    'You can only cancel your own bookings'
                );
            }

            // Validate booking is still confirmed
            if (bookingData.status !== 'confirmed') {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    `Booking is already ${bookingData.status}`
                );
            }

            const classRef = db.collection('classes').doc(bookingData.classId);
            const classDoc = await transaction.get(classRef);
            const userRef = db.collection('users').doc(userId);

            const now = FieldValue.serverTimestamp();

            // Update booking status
            transaction.update(bookingRef, {
                status: 'canceled',
                canceledAt: now,
                updatedAt: now,
            });

            // Release spot from class if class exists
            if (classDoc.exists) {
                const spotNumber = bookingData.spotNumber;
                const currentBookedCount = (classDoc.data()?.bookedCount as number) || 0;
                const updateData: Record<string, unknown> = {
                    bookedCount: Math.max(0, currentBookedCount - 1),
                    updatedAt: now,
                };
                if (spotNumber !== undefined) {
                    updateData.bookedSpots = FieldValue.arrayRemove(spotNumber);
                }
                transaction.update(classRef, updateData);
            }

            const creditType = bookingData.creditType || 'standard';
            if (creditType === 'intro_credit') {
                transaction.update(userRef, {
                    'subscription.introCreditRemaining': FieldValue.increment(1),
                    updatedAt: now,
                });
            } else if (creditType === 'guest_pass') {
                transaction.update(userRef, {
                    'subscription.guestPassesRemaining': FieldValue.increment(1),
                    updatedAt: now,
                });
            } else if (creditType === 'unlimited') {
                transaction.update(userRef, {
                    updatedAt: now,
                });
            } else {
                transaction.update(userRef, {
                    'subscription.classesRemaining': FieldValue.increment(1),
                    updatedAt: now,
                });
            }
        });

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Error canceling booking:', error);
        throw new functions.https.HttpsError('internal', 'Failed to cancel booking');
    }
});
