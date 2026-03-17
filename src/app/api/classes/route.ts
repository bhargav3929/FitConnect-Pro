import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

        const classRef = adminDb.collection('classes').doc();
        const now = FieldValue.serverTimestamp();
        const spots = totalSpots || capacity;

        const classDoc = {
            id: classRef.id,
            trainerId,
            date: Timestamp.fromDate(classDate),
            startTime,
            duration,
            capacity,
            bookedCount: 0,
            classType: classType || 'Pilates',
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

        // Build update object, only including provided fields
        const updateData: Record<string, unknown> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (updates.trainerId !== undefined) updateData.trainerId = updates.trainerId;
        if (updates.date !== undefined) {
            const newDate = new Date(updates.date);
            if (isNaN(newDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format', code: 'invalid-argument' }, { status: 400 });
            }
            updateData.date = Timestamp.fromDate(newDate);
        }
        if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
        if (updates.duration !== undefined) updateData.duration = updates.duration;
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

// DELETE — deleteClass (admin only, soft-delete by canceling)
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

        const body = await req.json();
        const { classId, cancelReason } = body;

        if (!classId || typeof classId !== 'string') {
            return NextResponse.json({ error: 'classId is required', code: 'invalid-argument' }, { status: 400 });
        }

        const classRef = adminDb.collection('classes').doc(classId);

        await adminDb.runTransaction(async (transaction) => {
            const classDoc = await transaction.get(classRef);

            if (!classDoc.exists) {
                throw { status: 404, error: 'Class not found', code: 'not-found' };
            }

            const classData = classDoc.data()!;

            if (classData.status === 'canceled') {
                throw { status: 400, error: 'Class is already canceled', code: 'failed-precondition' };
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
            const bookingsSnapshot = await adminDb.collection('bookings')
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
                const userRef = adminDb.collection('users').doc(bookingData.userId);
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
        console.error('Error deleting class:', error);
        return NextResponse.json(
            { error: 'Failed to cancel class', code: 'internal' },
            { status: 500 },
        );
    }
}
