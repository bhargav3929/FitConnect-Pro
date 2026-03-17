import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface CreateClassData {
    trainerId: string;
    date: string; // ISO string
    startTime: string; // "06:00"
    duration: number; // minutes
    capacity: number;
    classType?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    equipmentNeeded?: string;
    description?: string;
    totalSpots?: number;
    location?: string;
    intensityLevel?: 1 | 2 | 3;
}

export const createClass = functions.https.onCall(async (data: CreateClassData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Verify admin role via custom claims
    if (!context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const {
        trainerId,
        date,
        startTime,
        duration,
        capacity,
        classType,
        difficultyLevel,
        equipmentNeeded,
        description,
        totalSpots,
        location,
        intensityLevel,
    } = data;

    // Input validation
    if (!trainerId || typeof trainerId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'trainerId is required');
    }
    if (!date || typeof date !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'date is required as ISO string');
    }
    if (!startTime || typeof startTime !== 'string' || !/^\d{2}:\d{2}$/.test(startTime)) {
        throw new functions.https.HttpsError('invalid-argument', 'startTime is required in HH:MM format');
    }
    if (!duration || typeof duration !== 'number' || duration <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'duration must be a positive number (minutes)');
    }
    if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'capacity must be a positive number');
    }

    // Validate date is valid
    const classDate = new Date(date);
    if (isNaN(classDate.getTime())) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid date format');
    }

    // Verify trainer exists
    const trainerDoc = await db.collection('trainers').doc(trainerId).get();
    if (!trainerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Trainer not found');
    }

    try {
        const classRef = db.collection('classes').doc();
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

        return { success: true, classId: classRef.id };
    } catch (error) {
        console.error('Error creating class:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create class');
    }
});
