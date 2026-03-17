import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface BookClassData {
    classId: string;
    spotNumber: number;
    isGuest: boolean;
}

export const bookClass = functions.https.onCall(async (data: BookClassData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to book a class');
    }

    const { classId, spotNumber, isGuest } = data;
    const userId = context.auth.uid;

    // Input validation
    if (!classId || typeof classId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'classId is required and must be a string');
    }
    if (spotNumber === undefined || typeof spotNumber !== 'number' || spotNumber < 1) {
        throw new functions.https.HttpsError('invalid-argument', 'spotNumber is required and must be a positive number');
    }
    if (typeof isGuest !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'isGuest must be a boolean');
    }

    const classRef = db.collection('classes').doc(classId);
    const userRef = db.collection('users').doc(userId);

    try {
        const bookingId = await db.runTransaction(async (transaction) => {
            const classDoc = await transaction.get(classRef);
            const userDoc = await transaction.get(userRef);

            if (!classDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Class not found');
            }
            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'User profile not found');
            }

            const classData = classDoc.data()!;
            const userData = userDoc.data()!;

            // Validate class is still scheduled
            if (classData.status !== 'scheduled') {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    `Class is ${classData.status}, cannot book`
                );
            }

            // Validate class date is in the future
            const classDate = classData.date instanceof Timestamp
                ? classData.date.toDate()
                : new Date(classData.date);
            if (classDate < new Date()) {
                throw new functions.https.HttpsError('failed-precondition', 'Cannot book a class in the past');
            }

            // Validate capacity
            const totalSpots = classData.totalSpots || classData.capacity || 12;
            if (spotNumber > totalSpots) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    `Spot number ${spotNumber} exceeds total spots (${totalSpots})`
                );
            }

            // Validate spot is not already taken
            const bookedSpots: number[] = classData.bookedSpots || [];
            if (bookedSpots.includes(spotNumber)) {
                throw new functions.https.HttpsError(
                    'already-exists',
                    `Spot ${spotNumber} is already taken`
                );
            }

            // Validate capacity not exceeded
            const bookedCount = classData.bookedCount || 0;
            if (bookedCount >= totalSpots) {
                throw new functions.https.HttpsError('resource-exhausted', 'Class is fully booked');
            }

            // Validate user has active subscription with remaining classes
            const subscription = userData.subscription;
            if (!subscription || subscription.status !== 'active') {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'You need an active subscription to book classes'
                );
            }

            const subEndDate = subscription.endDate instanceof Timestamp
                ? subscription.endDate.toDate()
                : new Date(subscription.endDate);
            if (subEndDate < new Date()) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Your subscription has expired'
                );
            }

            if (subscription.classesRemaining <= 0) {
                throw new functions.https.HttpsError(
                    'resource-exhausted',
                    'No classes remaining on your subscription'
                );
            }

            // Check for duplicate booking (same user, same class)
            const existingBookingsSnapshot = await db.collection('bookings')
                .where('userId', '==', userId)
                .where('classId', '==', classId)
                .where('status', '==', 'confirmed')
                .limit(1)
                .get();

            if (!existingBookingsSnapshot.empty) {
                throw new functions.https.HttpsError(
                    'already-exists',
                    'You already have a confirmed booking for this class'
                );
            }

            // Create booking document
            const newBookingRef = db.collection('bookings').doc();
            const now = FieldValue.serverTimestamp();

            transaction.set(newBookingRef, {
                id: newBookingRef.id,
                userId,
                classId,
                trainerId: classData.trainerId || '',
                classDate: classData.date,
                bookingDate: now,
                status: 'confirmed',
                spotNumber,
                isGuest,
                createdAt: now,
                updatedAt: now,
            });

            // Update class: increment bookedCount, add spot to bookedSpots
            transaction.update(classRef, {
                bookedCount: FieldValue.increment(1),
                bookedSpots: FieldValue.arrayUnion(spotNumber),
                updatedAt: now,
            });

            // Decrement user's classesRemaining
            transaction.update(userRef, {
                'subscription.classesRemaining': FieldValue.increment(-1),
                updatedAt: now,
            });

            return newBookingRef.id;
        });

        return { success: true, bookingId };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Error booking class:', error);
        throw new functions.https.HttpsError('internal', 'Failed to book class');
    }
});
