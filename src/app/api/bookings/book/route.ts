import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        // Verify auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in to book a class', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;

        const body = await req.json();
        const { classId, spotNumber, isGuest } = body;

        // Input validation
        if (!classId || typeof classId !== 'string') {
            return NextResponse.json(
                { error: 'classId is required and must be a string', code: 'invalid-argument' },
                { status: 400 },
            );
        }
        if (spotNumber === undefined || typeof spotNumber !== 'number' || spotNumber < 1) {
            return NextResponse.json(
                { error: 'spotNumber is required and must be a positive number', code: 'invalid-argument' },
                { status: 400 },
            );
        }
        if (typeof isGuest !== 'boolean') {
            return NextResponse.json(
                { error: 'isGuest must be a boolean', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const classRef = adminDb.collection('classes').doc(classId);
        const userRef = adminDb.collection('users').doc(userId);

        const bookingId = await adminDb.runTransaction(async (transaction) => {
            const classDoc = await transaction.get(classRef);
            const userDoc = await transaction.get(userRef);

            if (!classDoc.exists) {
                throw { status: 404, error: 'Class not found', code: 'not-found' };
            }
            if (!userDoc.exists) {
                throw { status: 404, error: 'User profile not found', code: 'not-found' };
            }

            const classData = classDoc.data()!;
            const userData = userDoc.data()!;

            // Validate class is still scheduled
            if (classData.status !== 'scheduled') {
                throw { status: 400, error: `Class is ${classData.status}, cannot book`, code: 'failed-precondition' };
            }

            // Validate class date is in the future
            const classDate = classData.date instanceof Timestamp
                ? classData.date.toDate()
                : new Date(classData.date);
            if (classDate < new Date()) {
                throw { status: 400, error: 'Cannot book a class in the past', code: 'failed-precondition' };
            }

            // Validate capacity
            const totalSpots = classData.totalSpots || classData.capacity || 12;
            if (spotNumber > totalSpots) {
                throw { status: 400, error: `Spot number ${spotNumber} exceeds total spots (${totalSpots})`, code: 'invalid-argument' };
            }

            // Validate spot is not already taken
            const bookedSpots: number[] = classData.bookedSpots || [];
            if (bookedSpots.includes(spotNumber)) {
                throw { status: 409, error: `Spot ${spotNumber} is already taken`, code: 'already-exists' };
            }

            // Validate capacity not exceeded
            const bookedCount = classData.bookedCount || 0;
            if (bookedCount >= totalSpots) {
                throw { status: 409, error: 'Class is fully booked', code: 'resource-exhausted' };
            }

            // Validate user has active subscription with remaining classes
            const subscription = userData.subscription;
            if (!subscription || subscription.status !== 'active') {
                throw { status: 400, error: 'You need an active subscription to book classes', code: 'failed-precondition' };
            }

            const subEndDate = subscription.endDate instanceof Timestamp
                ? subscription.endDate.toDate()
                : new Date(subscription.endDate);
            if (subEndDate < new Date()) {
                throw { status: 400, error: 'Your subscription has expired', code: 'failed-precondition' };
            }

            if (subscription.classesRemaining <= 0) {
                throw { status: 409, error: 'No classes remaining on your subscription', code: 'resource-exhausted' };
            }

            // Check for duplicate booking (same user, same class)
            const existingBookingsSnapshot = await adminDb.collection('bookings')
                .where('userId', '==', userId)
                .where('classId', '==', classId)
                .where('status', '==', 'confirmed')
                .limit(1)
                .get();

            if (!existingBookingsSnapshot.empty) {
                throw { status: 409, error: 'You already have a confirmed booking for this class', code: 'already-exists' };
            }

            // Create booking document
            const newBookingRef = adminDb.collection('bookings').doc();
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

        return NextResponse.json({ success: true, bookingId });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error booking class:', error);
        return NextResponse.json(
            { error: 'Failed to book class', code: 'internal' },
            { status: 500 },
        );
    }
}
