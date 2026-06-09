import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { isIntroClassType } from '@fitconnect/shared/types/class';

function getDayWindow(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function hasActiveClassAtSlot(classDate: Date, startTime: string, excludeClassId?: string): Promise<boolean> {
    const { start, end } = getDayWindow(classDate);
    const snapshot = await adminDb.collection('classes')
        .where('date', '>=', Timestamp.fromDate(start))
        .where('date', '<=', Timestamp.fromDate(end))
        .get();

    return snapshot.docs.some((doc) => {
        if (doc.id === excludeClassId) return false;
        const data = doc.data();
        return data.startTime === startTime && data.status !== 'canceled';
    });
}

// POST — createClass (admin only)
export async function POST(req: NextRequest) {
    try {
        // Verify auth + admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        if (!decoded.admin) {
            return NextResponse.json(
                { error: 'Admin access required', code: 'permission-denied' },
                { status: 403 },
            );
        }

        const body = await req.json();
        const {
            trainerId, date, startTime, duration, capacity,
            classType, difficultyLevel, equipmentNeeded, description,
            totalSpots, location, intensityLevel,
        } = body;

        // Input validation
        if (!trainerId || typeof trainerId !== 'string') {
            return NextResponse.json({ error: 'trainerId is required', code: 'invalid-argument' }, { status: 400 });
        }
        if (!date || typeof date !== 'string') {
            return NextResponse.json({ error: 'date is required as ISO string', code: 'invalid-argument' }, { status: 400 });
        }
        if (!startTime || typeof startTime !== 'string' || !/^\d{2}:\d{2}$/.test(startTime)) {
            return NextResponse.json({ error: 'startTime is required in HH:MM format', code: 'invalid-argument' }, { status: 400 });
        }
        if (!duration || typeof duration !== 'number' || duration <= 0) {
            return NextResponse.json({ error: 'duration must be a positive number (minutes)', code: 'invalid-argument' }, { status: 400 });
        }
        if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
            return NextResponse.json({ error: 'capacity must be a positive number', code: 'invalid-argument' }, { status: 400 });
        }

        const classDate = new Date(date);
        if (isNaN(classDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date format', code: 'invalid-argument' }, { status: 400 });
        }

        // Verify trainer exists
        const trainerDoc = await adminDb.collection('trainers').doc(trainerId).get();
        if (!trainerDoc.exists) {
            return NextResponse.json({ error: 'Trainer not found', code: 'not-found' }, { status: 404 });
        }

        const hasConflict = await hasActiveClassAtSlot(classDate, startTime);
        if (hasConflict) {
            return NextResponse.json(
                { error: 'A class is already scheduled for this date and time.', code: 'already-exists' },
                { status: 409 },
            );
        }

        const classRef = adminDb.collection('classes').doc();
        const now = FieldValue.serverTimestamp();
        const spots = totalSpots || capacity;
        const finalClassType = classType || 'Sol Flow';
        const finalDuration = isIntroClassType(finalClassType) ? 30 : duration;

        const classDoc = {
            id: classRef.id,
            trainerId,
            date: Timestamp.fromDate(classDate),
            startTime,
            duration: finalDuration,
            capacity,
            bookedCount: 0,
            classType: finalClassType,
            difficultyLevel: difficultyLevel || 'intermediate',
            equipmentNeeded: equipmentNeeded || '',
            description: description || '',
            status: 'scheduled',
            totalSpots: spots,
            bookedSpots: [],
            location: location || 'Main Studio',
            intensityLevel: intensityLevel || 2,
            createdAt: now,
            updatedAt: now,
        };

        await classRef.set(classDoc);

        return NextResponse.json({ success: true, classId: classRef.id });
    } catch (error) {
        console.error('Error creating class:', error);
        return NextResponse.json(
            { error: 'Failed to create class', code: 'internal' },
            { status: 500 },
        );
    }
}

// PUT — updateClass (admin only)
export async function PUT(req: NextRequest) {
    try {
        // Verify auth + admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        if (!decoded.admin) {
            return NextResponse.json(
                { error: 'Admin access required', code: 'permission-denied' },
                { status: 403 },
            );
        }

        const body = await req.json();
        const { classId, ...updates } = body;

        if (!classId || typeof classId !== 'string') {
            return NextResponse.json({ error: 'classId is required', code: 'invalid-argument' }, { status: 400 });
        }

        // Validate specific fields if provided
        if (updates.startTime && !/^\d{2}:\d{2}$/.test(updates.startTime)) {
            return NextResponse.json({ error: 'startTime must be in HH:MM format', code: 'invalid-argument' }, { status: 400 });
        }
        if (updates.duration !== undefined && (typeof updates.duration !== 'number' || updates.duration <= 0)) {
            return NextResponse.json({ error: 'duration must be a positive number', code: 'invalid-argument' }, { status: 400 });
        }
        if (updates.capacity !== undefined && (typeof updates.capacity !== 'number' || updates.capacity <= 0)) {
            return NextResponse.json({ error: 'capacity must be a positive number', code: 'invalid-argument' }, { status: 400 });
        }

        const classRef = adminDb.collection('classes').doc(classId);
        const classDoc = await classRef.get();
        if (!classDoc.exists) {
            return NextResponse.json({ error: 'Class not found', code: 'not-found' }, { status: 404 });
        }

        // Validate that new capacity/totalSpots is not less than current booked count
        const classData = classDoc.data()!;
        const bookedCount = classData.bookedCount || 0;
        const newCapacity = updates.capacity ?? updates.totalSpots;
        if (newCapacity !== undefined && newCapacity < bookedCount) {
            return NextResponse.json(
                { error: `Cannot reduce capacity below current booked count (${bookedCount})`, code: 'failed-precondition' },
                { status: 400 },
            );
        }

        // Build update object, only including provided fields
        const updateData: Record<string, unknown> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        const nextDate = updates.date !== undefined
            ? new Date(updates.date)
            : toDate(classData.date);
        const nextStartTime = updates.startTime !== undefined
            ? updates.startTime
            : classData.startTime;
        const nextStatus = updates.status !== undefined ? updates.status : classData.status;

        if (!nextDate || Number.isNaN(nextDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date format', code: 'invalid-argument' }, { status: 400 });
        }
        if (nextStatus !== 'canceled' && typeof nextStartTime === 'string') {
            const hasConflict = await hasActiveClassAtSlot(nextDate, nextStartTime, classId);
            if (hasConflict) {
                return NextResponse.json(
                    { error: 'A class is already scheduled for this date and time.', code: 'already-exists' },
                    { status: 409 },
                );
            }
        }

        if (updates.trainerId !== undefined) updateData.trainerId = updates.trainerId;
        if (updates.date !== undefined) {
            const newDate = new Date(updates.date);
            if (isNaN(newDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format', code: 'invalid-argument' }, { status: 400 });
            }
            updateData.date = Timestamp.fromDate(newDate);
        }
        if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
        const nextClassType = updates.classType ?? classData.classType;
        if (isIntroClassType(nextClassType)) {
            updateData.duration = 30;
        } else if (updates.duration !== undefined) {
            updateData.duration = updates.duration;
        }
        if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
        if (updates.classType !== undefined) updateData.classType = updates.classType;
        if (updates.difficultyLevel !== undefined) updateData.difficultyLevel = updates.difficultyLevel;
        if (updates.equipmentNeeded !== undefined) updateData.equipmentNeeded = updates.equipmentNeeded;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.totalSpots !== undefined) updateData.totalSpots = updates.totalSpots;
        if (updates.location !== undefined) updateData.location = updates.location;
        if (updates.intensityLevel !== undefined) updateData.intensityLevel = updates.intensityLevel;
        if (updates.status !== undefined) updateData.status = updates.status;

        await classRef.update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating class:', error);
        return NextResponse.json(
            { error: 'Failed to update class', code: 'internal' },
            { status: 500 },
        );
    }
}

// DELETE — deleteClass (admin only, hard delete + cancel associated bookings)
export async function DELETE(req: NextRequest) {
    try {
        // Verify auth + admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        if (!decoded.admin) {
            return NextResponse.json(
                { error: 'Admin access required', code: 'permission-denied' },
                { status: 403 },
            );
        }

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const { classId } = body;

        if (!classId || typeof classId !== 'string') {
            return NextResponse.json({ error: 'classId is required', code: 'invalid-argument' }, { status: 400 });
        }

        const classRef = adminDb.collection('classes').doc(classId);
        const classDoc = await classRef.get();

        if (!classDoc.exists) {
            return NextResponse.json({ error: 'Class not found', code: 'not-found' }, { status: 404 });
        }

        // Cancel all confirmed bookings for this class and restore credits
        const bookingsSnapshot = await adminDb.collection('bookings')
            .where('classId', '==', classId)
            .where('status', '==', 'confirmed')
            .get();

        if (bookingsSnapshot.size > 0) {
            const batch = adminDb.batch();
            const now = FieldValue.serverTimestamp();

            for (const bookingDoc of bookingsSnapshot.docs) {
                const bookingData = bookingDoc.data();

                batch.update(bookingDoc.ref, {
                    status: 'canceled',
                    canceledAt: now,
                    cancelReason: 'Class deleted by admin',
                    updatedAt: now,
                });

                const userRef = adminDb.collection('users').doc(bookingData.userId);
                const creditType = bookingData.creditType || 'standard';
                if (creditType === 'intro_credit') {
                    batch.update(userRef, {
                        'subscription.introCreditRemaining': FieldValue.increment(1),
                        updatedAt: now,
                    });
                } else if (creditType === 'guest_pass') {
                    batch.update(userRef, {
                        'subscription.guestPassesRemaining': FieldValue.increment(1),
                        updatedAt: now,
                    });
                } else if (creditType === 'unlimited') {
                    batch.update(userRef, {
                        updatedAt: now,
                    });
                } else {
                    batch.update(userRef, {
                        'subscription.classesRemaining': FieldValue.increment(1),
                        updatedAt: now,
                    });
                }
            }

            await batch.commit();
        }

        // Hard delete the class document
        await classRef.delete();

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error deleting class:', error);
        return NextResponse.json(
            { error: 'Failed to delete class', code: 'internal' },
            { status: 500 },
        );
    }
}
