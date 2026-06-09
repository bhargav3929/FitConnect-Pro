import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface UpdateClassData {
    classId: string;
    trainerId?: string;
    date?: string;
    startTime?: string;
    duration?: number;
    capacity?: number;
    classType?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    equipmentNeeded?: string;
    description?: string;
    totalSpots?: number;
    location?: string;
    intensityLevel?: 1 | 2 | 3;
    status?: 'scheduled' | 'ongoing' | 'completed' | 'canceled';
}

const INTRO_CLASS_TYPE = 'Intro Class';

function isIntroClassType(classType: unknown): boolean {
    return typeof classType === 'string'
        && classType.trim().toLowerCase() === INTRO_CLASS_TYPE.toLowerCase();
}

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
    if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function hasActiveClassAtSlot(classDate: Date, startTime: string, excludeClassId: string): Promise<boolean> {
    const { start, end } = getDayWindow(classDate);
    const snapshot = await db.collection('classes')
        .where('date', '>=', Timestamp.fromDate(start))
        .where('date', '<=', Timestamp.fromDate(end))
        .get();

    return snapshot.docs.some((doc) => {
        if (doc.id === excludeClassId) return false;
        const data = doc.data();
        return data.startTime === startTime && data.status !== 'canceled';
    });
}

export const updateClass = functions.https.onCall(async (data: UpdateClassData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    if (!context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { classId, ...updates } = data;

    if (!classId || typeof classId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'classId is required');
    }

    // Validate specific fields if provided
    if (updates.startTime && !/^\d{2}:\d{2}$/.test(updates.startTime)) {
        throw new functions.https.HttpsError('invalid-argument', 'startTime must be in HH:MM format');
    }
    if (updates.duration !== undefined && (typeof updates.duration !== 'number' || updates.duration <= 0)) {
        throw new functions.https.HttpsError('invalid-argument', 'duration must be a positive number');
    }
    if (updates.capacity !== undefined && (typeof updates.capacity !== 'number' || updates.capacity <= 0)) {
        throw new functions.https.HttpsError('invalid-argument', 'capacity must be a positive number');
    }

    const classRef = db.collection('classes').doc(classId);

    try {
        const classDoc = await classRef.get();
        if (!classDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Class not found');
        }
        const classData = classDoc.data()!;

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
            throw new functions.https.HttpsError('invalid-argument', 'Invalid date format');
        }
        if (nextStatus !== 'canceled' && typeof nextStartTime === 'string') {
            const hasConflict = await hasActiveClassAtSlot(nextDate, nextStartTime, classId);
            if (hasConflict) {
                throw new functions.https.HttpsError(
                    'already-exists',
                    'A class is already scheduled for this date and time',
                );
            }
        }

        if (updates.trainerId !== undefined) updateData.trainerId = updates.trainerId;
        if (updates.date !== undefined) {
            const newDate = new Date(updates.date);
            if (isNaN(newDate.getTime())) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid date format');
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

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Error updating class:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update class');
    }
});
