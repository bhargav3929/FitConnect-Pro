import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// POST — admin enrolls a member into a class (bypasses subscription validation)
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
        const { userId, classId } = body;

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: 'userId is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (!classId || typeof classId !== 'string') {
            return NextResponse.json({ error: 'classId is required', code: 'invalid-argument' }, { status: 400 });
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

        // Check class date is not in the past
        const classDate = classData.date instanceof Timestamp ? classData.date.toDate() : new Date(classData.date);
        const classEndOfDay = new Date(classDate);
        classEndOfDay.setHours(23, 59, 59, 999);
        if (classEndOfDay < new Date()) {
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

        const batch = adminDb.batch();
        const newBookingRef = adminDb.collection('bookings').doc();
        const now = FieldValue.serverTimestamp();

        batch.set(newBookingRef, {
            id: newBookingRef.id,
            userId,
            userName,
            classId,
            trainerId: classData.trainerId || '',
            classDate: classData.date,
            bookingDate: now,
            status: 'confirmed',
            spotNumber,
            isGuest: false,
            guestName: '',
            creditType: 'admin_override',
            adminEnrolled: true,
            enrolledBy: decoded.uid,
            createdAt: now,
            updatedAt: now,
        });

        batch.update(classRef, {
            bookedCount: FieldValue.increment(1),
            bookedSpots: FieldValue.arrayUnion(spotNumber),
            updatedAt: now,
        });

        await batch.commit();

        return NextResponse.json({ success: true, bookingId: newBookingRef.id });
    } catch (error) {
        console.error('Error enrolling member:', error);
        return NextResponse.json({ error: 'Failed to enroll member', code: 'internal' }, { status: 500 });
    }
}
