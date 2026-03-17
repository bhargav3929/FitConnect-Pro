import * as functions from 'firebase-functions';
import { db } from '../init';
import { Timestamp } from 'firebase-admin/firestore';

export const getUserBookings = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const userId = context.auth.uid;

    try {
        const bookingsSnapshot = await db.collection('bookings')
            .where('userId', '==', userId)
            .orderBy('classDate', 'desc')
            .get();

        // Get associated class details
        const classIds = [...new Set(bookingsSnapshot.docs.map(doc => doc.data().classId))];
        const classDocs = await Promise.all(
            classIds.map(id => db.collection('classes').doc(id).get())
        );

        const classMap: Record<string, Record<string, unknown>> = {};
        classDocs.forEach(doc => {
            if (doc.exists) {
                const data = doc.data()!;
                classMap[doc.id] = {
                    classType: data.classType || 'Pilates',
                    startTime: data.startTime,
                    duration: data.duration,
                    location: data.location || 'Main Studio',
                    trainerId: data.trainerId,
                    status: data.status,
                };
            }
        });

        // Get trainer names for the classes
        const trainerIds = [...new Set(Object.values(classMap).map(c => c.trainerId as string).filter(Boolean))];
        const trainerDocs = await Promise.all(
            trainerIds.map(id => db.collection('trainers').doc(id).get())
        );

        const trainerMap: Record<string, string> = {};
        trainerDocs.forEach(doc => {
            if (doc.exists) {
                trainerMap[doc.id] = doc.data()!.name;
            }
        });

        const bookings = bookingsSnapshot.docs.map(doc => {
            const data = doc.data();
            const classInfo = classMap[data.classId] || {};
            const trainerName = trainerMap[classInfo.trainerId as string] || 'Unknown';

            return {
                ...data,
                id: doc.id,
                classType: classInfo.classType || 'Pilates',
                classStartTime: classInfo.startTime || '',
                classDuration: classInfo.duration || 0,
                classLocation: classInfo.location || 'Main Studio',
                classStatus: classInfo.status || 'unknown',
                trainerName,
                // Convert Timestamps to ISO strings
                classDate: data.classDate instanceof Timestamp ? data.classDate.toDate().toISOString() : data.classDate,
                bookingDate: data.bookingDate instanceof Timestamp ? data.bookingDate.toDate().toISOString() : data.bookingDate,
                canceledAt: data.canceledAt instanceof Timestamp ? data.canceledAt.toDate().toISOString() : data.canceledAt,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
        });

        return { success: true, bookings };
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch bookings');
    }
});
