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
        await adminAuth.verifyIdToken(token);

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || typeof startDate !== 'string') {
            return NextResponse.json(
                { error: 'startDate is required as ISO string', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return NextResponse.json(
                { error: 'Invalid startDate format', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        // Set start to beginning of day
        start.setHours(0, 0, 0, 0);

        let end: Date;
        if (endDate) {
            end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return NextResponse.json(
                    { error: 'Invalid endDate format', code: 'invalid-argument' },
                    { status: 400 },
                );
            }
        } else {
            end = new Date(start);
        }
        // Set end to end of day
        end.setHours(23, 59, 59, 999);

        const classesSnapshot = await adminDb.collection('classes')
            .where('date', '>=', Timestamp.fromDate(start))
            .where('date', '<=', Timestamp.fromDate(end))
            .where('status', '==', 'scheduled')
            .orderBy('date')
            .orderBy('startTime')
            .get();

        // Denormalize trainer info
        const trainerIds = [...new Set(classesSnapshot.docs.map(doc => doc.data().trainerId))];
        const trainerDocs = await Promise.all(
            trainerIds.map(id => adminDb.collection('trainers').doc(id).get()),
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

        return NextResponse.json({ success: true, classes });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json(
            { error: 'Failed to fetch schedule', code: 'internal' },
            { status: 500 },
        );
    }
}
