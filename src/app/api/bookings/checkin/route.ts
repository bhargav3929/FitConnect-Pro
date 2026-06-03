import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type CheckInAction = 'attended' | 'no-show';

function getClassStart(dateValue: unknown, startTime: unknown): Date {
    const classDate = dateValue instanceof Timestamp
        ? dateValue.toDate()
        : new Date(dateValue as string | number | Date);
    const [hh, mm] = typeof startTime === 'string'
        ? startTime.split(':').map((part) => parseInt(part, 10))
        : [0, 0];

    classDate.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
    return classDate;
}

function getSelfCheckInWindow(classStart: Date, durationMinutes: unknown) {
    const duration = typeof durationMinutes === 'number' && durationMinutes > 0 ? durationMinutes : 60;
    const opensAt = new Date(classStart.getTime() - 60 * 60 * 1000);
    const closesAt = new Date(classStart.getTime() + duration * 60 * 1000);
    return { opensAt, closesAt };
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in to check in', code: 'unauthenticated' },
                { status: 401 },
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;
        const isAdmin = decoded.admin === true;

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const { bookingId, action } = body;
        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json(
                { error: 'bookingId is required and must be a string', code: 'invalid-argument' },
                { status: 400 },
            );
        }
        if (action !== 'attended' && action !== 'no-show') {
            return NextResponse.json(
                { error: 'action must be attended or no-show', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const bookingRef = adminDb.collection('bookings').doc(bookingId);
        await adminDb.runTransaction(async (transaction) => {
            const bookingDoc = await transaction.get(bookingRef);
            if (!bookingDoc.exists) {
                throw { status: 404, error: 'Booking not found', code: 'not-found' };
            }

            const booking = bookingDoc.data()!;
            if (!isAdmin && booking.userId !== userId) {
                throw { status: 403, error: 'You can only check in for your own bookings', code: 'permission-denied' };
            }
            if (!isAdmin && action !== 'attended') {
                throw { status: 403, error: 'Only admins can mark no-show', code: 'permission-denied' };
            }
            if (booking.status !== 'confirmed') {
                throw { status: 400, error: `Booking is already ${booking.status}`, code: 'failed-precondition' };
            }

            const classDoc = await transaction.get(adminDb.collection('classes').doc(booking.classId));
            if (!classDoc.exists) {
                throw { status: 404, error: 'Class not found', code: 'not-found' };
            }

            const classData = classDoc.data()!;
            if (!isAdmin) {
                const classStart = getClassStart(classData.date ?? booking.classDate, classData.startTime);
                const { opensAt, closesAt } = getSelfCheckInWindow(classStart, classData.duration);
                const now = new Date();

                if (now < opensAt) {
                    throw { status: 400, error: 'Check-in opens 1 hour before class starts', code: 'checkin-not-open' };
                }
                if (now > closesAt) {
                    throw { status: 400, error: 'Check-in is closed for this class', code: 'checkin-closed' };
                }
            }

            const now = FieldValue.serverTimestamp();
            transaction.update(bookingRef, {
                status: action as CheckInAction,
                ...(action === 'attended' ? { attendedAt: now } : { noShowAt: now }),
                checkedInBy: isAdmin ? 'admin' : 'user',
                updatedAt: now,
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error checking in booking:', error);
        return NextResponse.json(
            { error: 'Failed to check in booking', code: 'internal' },
            { status: 500 },
        );
    }
}
