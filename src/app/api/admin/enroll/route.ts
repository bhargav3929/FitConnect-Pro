import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { isIntroClassType } from '@fitconnect/shared/types/class';
import { classEndAtStudio, classStartAtStudio } from '@fitconnect/shared/schedule/class-time';

// POST — admin enrolls a member into a class, either with a plan credit or complimentary.
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Must be logged in', code: 'unauthenticated' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        if (!decoded.admin) {
            return NextResponse.json({ error: 'Admin access required', code: 'permission-denied' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, classId, creditMode = 'no_credit' } = body;

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: 'userId is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (!classId || typeof classId !== 'string') {
            return NextResponse.json({ error: 'classId is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (creditMode !== 'available_credit' && creditMode !== 'no_credit') {
            return NextResponse.json({ error: 'creditMode must be available_credit or no_credit', code: 'invalid-argument' }, { status: 400 });
        }

        const classRef = adminDb.collection('classes').doc(classId);
        const userRef = adminDb.collection('users').doc(userId);

        const [classDoc, userDoc] = await Promise.all([classRef.get(), userRef.get()]);

        if (!classDoc.exists) {
            return NextResponse.json({ error: 'Class not found', code: 'not-found' }, { status: 404 });
        }
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found', code: 'not-found' }, { status: 404 });
        }

        const classData = classDoc.data()!;
        const userData = userDoc.data()!;

        if (classData.status !== 'scheduled') {
            return NextResponse.json({ error: `Class is ${classData.status}`, code: 'failed-precondition' }, { status: 400 });
        }

        // A class can only be enrolled until its end time.
        const classDate = classData.date instanceof Timestamp ? classData.date.toDate() : new Date(classData.date);
        const classEnd = classEndAtStudio(classDate, classData.startTime, classData.duration);
        if (!classEnd || classEnd <= new Date()) {
            return NextResponse.json({ error: 'Cannot enroll in a past class', code: 'failed-precondition' }, { status: 400 });
        }

        // Check if already enrolled
        const existingSnap = await adminDb.collection('bookings')
            .where('classId', '==', classId)
            .where('status', '==', 'confirmed')
            .get();
        const alreadyEnrolled = existingSnap.docs.some(d => d.data().userId === userId);
        if (alreadyEnrolled) {
            return NextResponse.json({ error: 'Member is already enrolled in this class', code: 'already-exists' }, { status: 409 });
        }

        const totalSpots = classData.totalSpots || classData.capacity || 10;
        const bookedCount = classData.bookedCount || 0;
        if (bookedCount >= totalSpots) {
            return NextResponse.json({ error: 'Class is fully booked', code: 'resource-exhausted' }, { status: 409 });
        }

        // Find first available spot
        const bookedSpots: number[] = classData.bookedSpots || [];
        let spotNumber = -1;
        for (let i = 1; i <= totalSpots; i++) {
            if (!bookedSpots.includes(i)) { spotNumber = i; break; }
        }
        if (spotNumber === -1) {
            return NextResponse.json({ error: 'No spots available', code: 'resource-exhausted' }, { status: 409 });
        }

        const userName = (typeof userData.displayName === 'string' && userData.displayName.trim())
            ? userData.displayName.trim()
            : (typeof userData.name === 'string' && userData.name.trim())
                ? userData.name.trim()
                : userId;

        const bookingId = await adminDb.runTransaction(async (transaction) => {
            const currentUserDoc = await transaction.get(userRef);
            const currentClassDoc = await transaction.get(classRef);
            const duplicateBookingQuery = adminDb.collection('bookings')
                .where('userId', '==', userId)
                .where('classId', '==', classId)
                .where('status', '==', 'confirmed')
                .limit(1);
            const duplicateBookingSnapshot = await transaction.get(duplicateBookingQuery);
            if (!currentUserDoc.exists || !currentClassDoc.exists) {
                throw { status: 404, error: 'Class or user was not found', code: 'not-found' };
            }
            if (!duplicateBookingSnapshot.empty) {
                throw { status: 409, error: 'Member is already enrolled in this class', code: 'already-exists' };
            }

            const currentUser = currentUserDoc.data()!;
            const currentClass = currentClassDoc.data()!;
            if (currentClass.status !== 'scheduled') {
                throw { status: 400, error: `Class is ${currentClass.status}`, code: 'failed-precondition' };
            }
            const currentClassDate = currentClass.date instanceof Timestamp
                ? currentClass.date.toDate()
                : new Date(currentClass.date);
            const currentClassEnd = classEndAtStudio(currentClassDate, currentClass.startTime, currentClass.duration);
            if (!currentClassEnd || currentClassEnd <= new Date()) {
                throw { status: 400, error: 'Cannot enroll in a past class', code: 'failed-precondition' };
            }
            const currentBookedSpots: number[] = currentClass.bookedSpots || [];
            const currentCapacity = currentClass.totalSpots || currentClass.capacity || 10;
            let currentSpotNumber = -1;
            for (let i = 1; i <= currentCapacity; i++) {
                if (!currentBookedSpots.includes(i)) {
                    currentSpotNumber = i;
                    break;
                }
            }
            if ((currentClass.bookedCount || 0) >= currentCapacity || currentSpotNumber === -1) {
                throw { status: 409, error: 'Class is fully booked', code: 'resource-exhausted' };
            }

            const isDemoClass = isIntroClassType(currentClass.classType);
            const subscription = currentUser.subscription as Record<string, unknown> | undefined;
            let creditType: 'standard' | 'unlimited' | 'intro_credit' | 'admin_override' = 'admin_override';

            if (creditMode === 'available_credit') {
                if (!subscription || subscription.status !== 'active') {
                    throw { status: 400, error: 'This member does not have an active plan with an available credit.', code: 'subscription-required' };
                }

                const endDate = subscription.endDate instanceof Timestamp
                    ? subscription.endDate.toDate()
                    : subscription.endDate ? new Date(subscription.endDate as string | number | Date) : new Date(0);
                if (Number.isNaN(endDate.getTime()) || endDate < new Date()) {
                    throw { status: 400, error: 'This member\'s subscription has expired.', code: 'subscription-expired' };
                }
                const currentClassStart = classStartAtStudio(currentClassDate, currentClass.startTime);
                if (!currentClassStart || currentClassStart > endDate) {
                    throw { status: 400, error: 'This class is after the member\'s subscription end date.', code: 'subscription-expired-before-class' };
                }

                if (isDemoClass) {
                    const demoCredits = typeof subscription.introCreditRemaining === 'number'
                        ? subscription.introCreditRemaining
                        : 0;
                    if (demoCredits <= 0) {
                        throw { status: 409, error: 'This member has no Demo Class credit available.', code: 'resource-exhausted' };
                    }
                    creditType = 'intro_credit';
                } else if (subscription.classesRemaining === null) {
                    creditType = 'unlimited';
                } else {
                    const classCredits = typeof subscription.classesRemaining === 'number'
                        ? subscription.classesRemaining
                        : 0;
                    if (classCredits <= 0) {
                        throw { status: 409, error: 'This member has no class credits available.', code: 'resource-exhausted' };
                    }
                    creditType = 'standard';
                }
            }

            const newBookingRef = adminDb.collection('bookings').doc();
            const notificationRef = adminDb.collection('notifications').doc();
            const now = FieldValue.serverTimestamp();
            const className = typeof currentClass.classType === 'string' && currentClass.classType.trim()
                ? currentClass.classType.trim()
                : 'class';
            const classDateLabel = currentClassDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
            });
            transaction.set(newBookingRef, {
                id: newBookingRef.id,
                userId,
                userName,
                classId,
                trainerId: currentClass.trainerId || '',
                classDate: currentClass.date,
                bookingDate: now,
                status: 'confirmed',
                spotNumber: currentSpotNumber,
                isGuest: false,
                guestName: '',
                creditType,
                planIdAtBooking: subscription?.planId || null,
                usedGuestPass: false,
                usedIntroCredit: creditType === 'intro_credit',
                adminEnrolled: true,
                enrolledBy: decoded.uid,
                createdAt: now,
                updatedAt: now,
            });
            transaction.set(notificationRef, {
                id: notificationRef.id,
                userId,
                type: 'booking_confirmed',
                title: `You're booked for ${className}`,
                body: `The studio added you to ${className} on ${classDateLabel}${currentClass.startTime ? ` at ${currentClass.startTime}` : ''}.`,
                read: false,
                readAt: null,
                link: '/user/bookings',
                createdAt: now,
            });
            transaction.update(classRef, {
                bookedCount: FieldValue.increment(1),
                bookedSpots: FieldValue.arrayUnion(currentSpotNumber),
                updatedAt: now,
            });

            if (creditType === 'intro_credit') {
                transaction.update(userRef, {
                    'subscription.introCreditRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            } else if (creditType === 'standard') {
                transaction.update(userRef, {
                    'subscription.classesRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            } else if (creditType === 'unlimited') {
                transaction.update(userRef, { updatedAt: now });
            }

            return newBookingRef.id;
        });

        return NextResponse.json({ success: true, bookingId });
    } catch (error) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error enrolling member:', error);
        return NextResponse.json({ error: 'Failed to enroll member', code: 'internal' }, { status: 500 });
    }
}
