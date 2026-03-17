import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue } from 'firebase-admin/firestore';

interface DeleteClassData {
    classId: string;
    cancelReason?: string;
}

export const deleteClass = functions.https.onCall(async (data: DeleteClassData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    if (!context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { classId, cancelReason } = data;

    if (!classId || typeof classId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'classId is required');
    }

    const classRef = db.collection('classes').doc(classId);

    try {
        await db.runTransaction(async (transaction) => {
            const classDoc = await transaction.get(classRef);

            if (!classDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Class not found');
            }

            const classData = classDoc.data()!;

            if (classData.status === 'canceled') {
                throw new functions.https.HttpsError('failed-precondition', 'Class is already canceled');
            }

            const now = FieldValue.serverTimestamp();

            // Cancel the class
            transaction.update(classRef, {
                status: 'canceled',
                canceledAt: now,
                cancelReason: cancelReason || 'Canceled by admin',
                updatedAt: now,
            });

            // Find all confirmed bookings for this class and cancel them
            const bookingsSnapshot = await db.collection('bookings')
                .where('classId', '==', classId)
                .where('status', '==', 'confirmed')
                .get();

            for (const bookingDoc of bookingsSnapshot.docs) {
                const bookingData = bookingDoc.data();

                // Cancel each booking
                transaction.update(bookingDoc.ref, {
                    status: 'canceled',
                    canceledAt: now,
                    cancelReason: 'Class canceled by admin',
                    updatedAt: now,
                });

                // Restore classesRemaining for each user
                const userRef = db.collection('users').doc(bookingData.userId);
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
        console.error('Error deleting class:', error);
        throw new functions.https.HttpsError('internal', 'Failed to cancel class');
    }
});
