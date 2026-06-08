import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getPlanById, LEGACY_PLAN_MAP } from '@fitconnect/shared/types/subscription';
import { isIntroClassType } from '@fitconnect/shared/types/class';

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

function getPlanWeeklyLimit(planId: unknown): number | undefined {
    if (typeof planId !== 'string') return undefined;
    const mappedPlanId = LEGACY_PLAN_MAP[planId] ?? planId;
    return getPlanById(mappedPlanId)?.weeklyClassLimit;
}

function getMappedPlanId(planId: unknown): string | undefined {
    if (typeof planId !== 'string') return undefined;
    return LEGACY_PLAN_MAP[planId] ?? planId;
}

function getPositiveNumber(value: unknown): number | undefined {
    return typeof value === 'number' && value > 0 ? value : undefined;
}

function getClassStartDate(classDate: Date, startTime: unknown): Date {
    const date = new Date(classDate);
    if (typeof startTime === 'string') {
        const match = startTime.trim().match(/^(\d{1,2}):(\d{2})/);
        if (match) {
            date.setHours(Number(match[1]), Number(match[2]), 0, 0);
            return date;
        }
    }
    date.setHours(0, 0, 0, 0);
    return date;
}

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

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body', code: 'invalid-argument' },
                { status: 400 },
            );
        }
        const { classId, spotNumber, isGuest, guestName } = body;

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
            const userName = typeof userData.displayName === 'string' && userData.displayName.trim()
                ? userData.displayName.trim()
                : typeof userData.name === 'string' && userData.name.trim()
                    ? userData.name.trim()
                    : decoded.name || decoded.email || userId;

            // Validate class is still scheduled
            if (classData.status !== 'scheduled') {
                throw { status: 400, error: `Class is ${classData.status}, cannot book`, code: 'failed-precondition' };
            }

            // Validate class date is in the future (compare end-of-day since date field is midnight)
            const classDate = classData.date instanceof Timestamp
                ? classData.date.toDate()
                : new Date(classData.date);
            const classEndOfDay = new Date(classDate);
            classEndOfDay.setHours(23, 59, 59, 999);
            if (classEndOfDay < new Date()) {
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

            // ── Subscription validation ──────────────────────────────
            const subscription = userData.subscription;
            if (!subscription || subscription.status !== 'active') {
                throw { status: 400, error: 'You need an active subscription to book classes', code: 'subscription-required' };
            }

            // Auto-expire check
            const subEndDate = subscription.endDate instanceof Timestamp
                ? subscription.endDate.toDate()
                : subscription.endDate ? new Date(subscription.endDate) : new Date(0);

            if (subEndDate < new Date()) {
                // Auto-expire the subscription
                transaction.update(userRef, {
                    'subscription.status': 'expired',
                    updatedAt: FieldValue.serverTimestamp(),
                });
                throw { status: 400, error: 'Your subscription has expired. Please renew to continue booking.', code: 'subscription-expired' };
            }

            const classStartDate = getClassStartDate(classDate, classData.startTime);
            if (classStartDate > subEndDate) {
                throw {
                    status: 400,
                    error: 'This class is after your subscription end date. Please renew to book it.',
                    code: 'subscription-expired-before-class',
                };
            }

            const mappedPlanId = getMappedPlanId(subscription.planId || subscription.planType);
            const isIntroPlan = mappedPlanId === 'drop_in';
            const isIntroClass = isIntroClassType(classData.classType);
            const introCreditRemaining = typeof subscription.introCreditRemaining === 'number'
                ? Math.max(0, subscription.introCreditRemaining)
                : 0;

            if (isIntroPlan && !isIntroClass) {
                throw {
                    status: 400,
                    error: 'A membership is required to book regular classes.',
                    code: 'intro-plan-class-required',
                };
            }

            if (isIntroClass && introCreditRemaining <= 0) {
                throw {
                    status: 400,
                    error: 'An unused intro credit is required to book an Intro Class.',
                    code: 'intro-class-plan-required',
                };
            }

            if (isIntroClass && isGuest) {
                throw {
                    status: 400,
                    error: 'Intro Class cannot be booked as a guest reservation.',
                    code: 'invalid-argument',
                };
            }

            // Determine credit type
            const isUnlimited = subscription.classesRemaining === null;
            let creditType: 'standard' | 'unlimited' | 'guest_pass' | 'intro_credit' = 'standard';
            let usedGuestPass = false;
            let usedIntroCredit = false;

            if (isIntroClass) {
                creditType = 'intro_credit';
                usedIntroCredit = true;
            } else if (isGuest) {
                // Guest pass booking
                const guestPasses = subscription.guestPassesRemaining ?? 0;
                if (guestPasses <= 0) {
                    throw { status: 409, error: 'No guest passes remaining on your subscription', code: 'resource-exhausted' };
                }
                creditType = 'guest_pass';
                usedGuestPass = true;
            } else if (isUnlimited) {
                creditType = 'unlimited';
            } else {
                // Standard credit check
                if ((subscription.classesRemaining ?? 0) <= 0) {
                    throw { status: 409, error: 'No classes remaining on your subscription. Upgrade or purchase more credits.', code: 'resource-exhausted' };
                }
                creditType = 'standard';
            }

            // ── Per-day booking limit ────────────────────────────────
            const maxPerDay = getPositiveNumber(subscription.maxClassesPerDay) ?? 1;
            const classDayStart = new Date(classDate);
            classDayStart.setHours(0, 0, 0, 0);
            const classDayEnd = new Date(classDate);
            classDayEnd.setHours(23, 59, 59, 999);

            // Query user's confirmed bookings, then filter by date in-memory
            // (avoids complex composite index requirements)
            const userBookingsSnapshot = await adminDb.collection('bookings')
                .where('userId', '==', userId)
                .where('status', '==', 'confirmed')
                .get();

            const sameDayConfirmed = userBookingsSnapshot.docs.filter(d => {
                const bDate = d.data().classDate;
                const bookingDate = bDate?.toDate ? bDate.toDate() : new Date(bDate);
                return bookingDate >= classDayStart && bookingDate <= classDayEnd;
            });

            const sameDayStandardConfirmed = isIntroClass
                ? sameDayConfirmed
                : sameDayConfirmed.filter(d => d.data().creditType !== 'intro_credit');

            if (!isIntroClass && sameDayStandardConfirmed.length >= maxPerDay) {
                throw { status: 409, error: `You can only book ${maxPerDay} class per day on your current plan`, code: 'daily-limit-reached' };
            }

            // ── Weekly booking limit (Monday-Sunday) ────────────────
            const fallbackPlanLimit = getPlanWeeklyLimit(subscription.planId || subscription.planType);
            const weeklyClassLimit = getPositiveNumber(subscription.weeklyClassLimit) ?? fallbackPlanLimit ?? 1;
            const classWeek = getMondayWeekWindow(classDate);

            const sameWeekConfirmed = userBookingsSnapshot.docs.filter(d => {
                const bDate = d.data().classDate;
                const bookingDate = bDate?.toDate ? bDate.toDate() : new Date(bDate);
                return bookingDate >= classWeek.start && bookingDate <= classWeek.end;
            });

            const sameWeekStandardConfirmed = isIntroClass
                ? sameWeekConfirmed
                : sameWeekConfirmed.filter(d => d.data().creditType !== 'intro_credit');

            if (!isIntroClass && sameWeekStandardConfirmed.length >= weeklyClassLimit) {
                throw {
                    status: 409,
                    error: `You can only book ${weeklyClassLimit} class${weeklyClassLimit === 1 ? '' : 'es'} per week on your current plan`,
                    code: 'weekly-limit-reached',
                };
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

            // ── Create booking document ──────────────────────────────
            const newBookingRef = adminDb.collection('bookings').doc();
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
                guestName: isGuest ? (guestName as string) || '' : '',
                creditType,
                planIdAtBooking: subscription.planId || null,
                usedGuestPass,
                usedIntroCredit,
                createdAt: now,
                updatedAt: now,
            });

            // Update class: increment bookedCount, add spot to bookedSpots
            transaction.update(classRef, {
                bookedCount: FieldValue.increment(1),
                bookedSpots: FieldValue.arrayUnion(spotNumber),
                updatedAt: now,
            });

            // ── Decrement appropriate credit ─────────────────────────
            if (usedIntroCredit) {
                transaction.update(userRef, {
                    'subscription.introCreditRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            } else if (usedGuestPass) {
                transaction.update(userRef, {
                    'subscription.guestPassesRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            } else if (!isUnlimited) {
                transaction.update(userRef, {
                    'subscription.classesRemaining': FieldValue.increment(-1),
                    updatedAt: now,
                });
            } else {
                // Unlimited — just update timestamp
                transaction.update(userRef, {
                    updatedAt: now,
                });
            }

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
