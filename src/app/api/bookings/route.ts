import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
    try {
        // Verify auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;

        const bookingsSnapshot = await adminDb.collection('bookings')
            .where('userId', '==', userId)
            .orderBy('classDate', 'desc')
            .get();

        // Get associated class details
        const classIds = [...new Set(bookingsSnapshot.docs.map(doc => doc.data().classId))];
        const classDocs = await Promise.all(
            classIds.map(id => adminDb.collection('classes').doc(id).get()),
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
        const trainerIds = [...new Set(
            Object.values(classMap).map(c => c.trainerId as string).filter(Boolean),
        )];
        const trainerDocs = await Promise.all(
            trainerIds.map(id => adminDb.collection('trainers').doc(id).get()),
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

        return NextResponse.json({ success: true, bookings });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookings', code: 'internal' },
            { status: 500 },
        );
    }
}
