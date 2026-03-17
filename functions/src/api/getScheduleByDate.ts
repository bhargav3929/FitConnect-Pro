import * as functions from 'firebase-functions';
import { db } from '../init';
import { Timestamp } from 'firebase-admin/firestore';

interface GetScheduleByDateData {
    startDate: string; // ISO string
    endDate?: string; // ISO string, defaults to same day
}

export const getScheduleByDate = functions.https.onCall(async (data: GetScheduleByDateData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { startDate, endDate } = data;

    if (!startDate || typeof startDate !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'startDate is required as ISO string');
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid startDate format');
    }

    // Set start to beginning of day
    start.setHours(0, 0, 0, 0);

    let end: Date;
    if (endDate) {
        end = new Date(endDate);
        if (isNaN(end.getTime())) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid endDate format');
        }
    } else {
        end = new Date(start);
    }
    // Set end to end of day
    end.setHours(23, 59, 59, 999);

    try {
        const classesSnapshot = await db.collection('classes')
            .where('date', '>=', Timestamp.fromDate(start))
            .where('date', '<=', Timestamp.fromDate(end))
            .where('status', '==', 'scheduled')
            .orderBy('date')
            .orderBy('startTime')
            .get();

        // Denormalize trainer info
        const trainerIds = [...new Set(classesSnapshot.docs.map(doc => doc.data().trainerId))];
        const trainerDocs = await Promise.all(
            trainerIds.map(id => db.collection('trainers').doc(id).get())
        );

        const trainerMap: Record<string, { name: string; profilePictureUrl: string; specialties: string[] }> = {};
        trainerDocs.forEach(doc => {
            if (doc.exists) {
                const data = doc.data()!;
                trainerMap[doc.id] = {
                    name: data.name,
                    profilePictureUrl: data.profilePictureUrl || '',
                    specialties: data.specialties || [],
                };
            }
        });

        const classes = classesSnapshot.docs.map(doc => {
            const data = doc.data();
            const trainer = trainerMap[data.trainerId] || { name: 'Unknown', profilePictureUrl: '', specialties: [] };
            return {
                ...data,
                id: doc.id,
                trainerName: trainer.name,
                instructorImage: trainer.profilePictureUrl,
                trainerSpecialties: trainer.specialties,
                // Convert Timestamp to ISO for client
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
        });

        return { success: true, classes };
    } catch (error) {
        console.error('Error fetching schedule:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch schedule');
    }
});
