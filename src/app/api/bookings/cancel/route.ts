import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        // Verify auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in to cancel a booking', code: 'unauthenticated' },
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
        const { bookingId } = body;

        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json(
                { error: 'bookingId is required and must be a string', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const bookingRef = adminDb.collection('bookings').doc(bookingId);

        await adminDb.runTransaction(async (transaction) => {
            const bookingDoc = await transaction.get(bookingRef);

            if (!bookingDoc.exists) {
                throw { status: 404, error: 'Booking not found', code: 'not-found' };
            }

            const bookingData = bookingDoc.data()!;

            // Validate ownership
            if (bookingData.userId !== userId) {
                throw { status: 403, error: 'You can only cancel your own bookings', code: 'permission-denied' };
            }

            // Validate booking is still confirmed
            if (bookingData.status !== 'confirmed') {
                throw { status: 400, error: `Booking is already ${bookingData.status}`, code: 'failed-precondition' };
            }

            const classRef = adminDb.collection('classes').doc(bookingData.classId);
            const classDoc = await transaction.get(classRef);
            const userRef = adminDb.collection('users').doc(userId);

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
                const updateData: Record<string, unknown> = {
                    bookedCount: FieldValue.increment(-1),
                    updatedAt: now,
                };
                if (spotNumber !== undefined) {
                    updateData.bookedSpots = FieldValue.arrayRemove(spotNumber);
                }
                transaction.update(classRef, updateData);
            }

            // ── Credit-type-aware restore ────────────────────────────
            const creditType = bookingData.creditType || 'standard';
            const usedGuestPass = bookingData.usedGuestPass === true;

            if (usedGuestPass || creditType === 'guest_pass') {
                // Restore guest pass
                transaction.update(userRef, {
                    'subscription.guestPassesRemaining': FieldValue.increment(1),
                    updatedAt: now,
                });
            } else if (creditType === 'intro_credit') {
                transaction.update(userRef, {
                    'subscription.introCreditRemaining': FieldValue.increment(1),
                    updatedAt: now,
                });
            } else if (creditType === 'unlimited') {
                // Unlimited — no credits to restore, just update timestamp
                transaction.update(userRef, {
                    updatedAt: now,
                });
            } else {
                // Standard credit — restore classesRemaining
                transaction.update(userRef, {
                    'subscription.classesRemaining': FieldValue.increment(1),
                    updatedAt: now,
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error canceling booking:', error);
        return NextResponse.json(
            { error: 'Failed to cancel booking', code: 'internal' },
            { status: 500 },
        );
    }
}
