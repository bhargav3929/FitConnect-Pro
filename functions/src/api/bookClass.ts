import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface BookClassData {
    classId: string;
    spotNumber: number;
    isGuest: boolean;
}

const INTRO_CLASS_TYPE = 'Intro Class';

function isIntroClassType(classType: unknown): boolean {
    return typeof classType === 'string'
        && classType.trim().toLowerCase() === INTRO_CLASS_TYPE.toLowerCase();
}

function getMondayWeekWindow(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

function getFallbackWeeklyLimit(planId: unknown): number {
    switch (planId) {
        case 'kickstarter':
        case 'twice_quarterly':
        case 'twice_6mo':
        case 'weekly':
        case 'monthly':
        case 'quarterly':
        case 'twice_weekly':
            return 2;
        case 'thrice_quarterly':
        case 'thrice_6mo':
        case 'unlimited':
            return 3;
        case 'drop_in':
        default:
            return 1;
    }
}

function getPositiveNumber(value: unknown): number | undefined {
    return typeof value === 'number' && value > 0 ? value : undefined;
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
            const userName = typeof userData.displayName === 'string' && userData.displayName.trim()
                ? userData.displayName.trim()
                : typeof userData.name === 'string' && userData.name.trim()
                    ? userData.name.trim()
                    : context.auth?.token.name || context.auth?.token.email || userId;

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

            const isIntroPlan = (subscription.planId || subscription.planType) === 'drop_in';
            const isIntroClass = isIntroClassType(classData.classType);
            const introCreditRemaining = typeof subscription.introCreditRemaining === 'number'
                ? Math.max(0, subscription.introCreditRemaining)
                : 0;

            if (isIntroPlan && !isIntroClass) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'A membership is required to book regular classes.'
                );
            }

            if (isIntroClass && introCreditRemaining <= 0) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'An unused intro credit is required to book an Intro Class.'
                );
            }

            if (isIntroClass && isGuest) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Intro Class cannot be booked as a guest reservation.'
                );
            }

            if (!isIntroClass && subscription.classesRemaining <= 0) {
                throw new functions.https.HttpsError(
                    'resource-exhausted',
                    'No classes remaining on your subscription'
                );
            }

            const userConfirmedBookingsSnapshot = await db.collection('bookings')
                .where('userId', '==', userId)
                .where('status', '==', 'confirmed')
                .get();

            const weeklyClassLimit = getPositiveNumber(subscription.weeklyClassLimit) ?? getFallbackWeeklyLimit(subscription.planId || subscription.planType);
            const classWeek = getMondayWeekWindow(classDate);
            const sameWeekConfirmed = userConfirmedBookingsSnapshot.docs.filter((bookingDoc) => {
                const bookingDateRaw = bookingDoc.data().classDate;
                const bookingDate = bookingDateRaw instanceof Timestamp
                    ? bookingDateRaw.toDate()
                    : new Date(bookingDateRaw);
                return bookingDate >= classWeek.start && bookingDate <= classWeek.end;
            });

            const sameWeekStandardConfirmed = sameWeekConfirmed.filter((bookingDoc) => bookingDoc.data().creditType !== 'intro_credit');

            if (!isIntroClass && sameWeekStandardConfirmed.length >= weeklyClassLimit) {
                throw new functions.https.HttpsError(
                    'resource-exhausted',
                    `You can only book ${weeklyClassLimit} class${weeklyClassLimit === 1 ? '' : 'es'} per week on your current plan`
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
                userName,
                classId,
                trainerId: classData.trainerId || '',
                classDate: classData.date,
                bookingDate: now,
                status: 'confirmed',
                spotNumber,
                isGuest,
                creditType: isIntroClass ? 'intro_credit' : 'standard',
                planIdAtBooking: subscription.planId || null,
                usedGuestPass: false,
                usedIntroCredit: isIntroClass,
                createdAt: now,
                updatedAt: now,
            });

            // Update class: increment bookedCount, add spot to bookedSpots
            transaction.update(classRef, {
                bookedCount: FieldValue.increment(1),
                bookedSpots: FieldValue.arrayUnion(spotNumber),
                updatedAt: now,
            });

            if (isIntroClass) {
                transaction.update(userRef, {
                    'subscription.introCreditRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            } else {
                transaction.update(userRef, {
                    'subscription.classesRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            }

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
