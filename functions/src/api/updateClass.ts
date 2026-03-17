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

        // Build update object, only including provided fields
        const updateData: Record<string, unknown> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (updates.trainerId !== undefined) updateData.trainerId = updates.trainerId;
        if (updates.date !== undefined) {
            const newDate = new Date(updates.date);
            if (isNaN(newDate.getTime())) {
                throw new functions.https.HttpsError('invalid-argument', 'Invalid date format');
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

        return { success: true };
    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Error updating class:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update class');
    }
});
