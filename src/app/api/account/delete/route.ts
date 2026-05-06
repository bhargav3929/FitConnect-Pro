import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in to delete account', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;

        const now = FieldValue.serverTimestamp();

        // Cancel all upcoming confirmed bookings and release their class spots.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookingsSnap = await adminDb
            .collection('bookings')
            .where('userId', '==', userId)
            .get();

        for (const bDoc of bookingsSnap.docs) {
            const b = bDoc.data();
            const classDate = b.classDate?.toDate
                ? b.classDate.toDate()
                : new Date(b.classDate);

            // Release spot for upcoming confirmed bookings only
            if (b.status === 'confirmed' && classDate >= today) {
                const classRef = adminDb.collection('classes').doc(b.classId);
                const classDoc = await classRef.get();
                if (classDoc.exists) {
                    const update: Record<string, unknown> = {
                        bookedCount: FieldValue.increment(-1),
                        updatedAt: now,
                    };
                    if (b.spotNumber !== undefined) {
                        update.bookedSpots = FieldValue.arrayRemove(b.spotNumber);
                    }
                    await classRef.update(update);
                }
            }

            // Anonymize the booking record (preserve historical aggregates, drop PII).
            await bDoc.ref.update({
                userId: 'deleted-user',
                status: b.status === 'confirmed' && classDate >= today ? 'canceled' : b.status,
                canceledAt: b.status === 'confirmed' ? now : b.canceledAt ?? null,
                updatedAt: now,
                deletedByUser: true,
            });
        }

        // Delete the Firestore user profile
        await adminDb.collection('users').doc(userId).delete();

        // Delete any admin role doc if present
        await adminDb.collection('admins').doc(userId).delete().catch(() => {});

        // Delete the Auth user (irreversible)
        await adminAuth.deleteUser(userId);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'Failed to delete account', code: 'internal' },
            { status: 500 },
        );
    }
}
