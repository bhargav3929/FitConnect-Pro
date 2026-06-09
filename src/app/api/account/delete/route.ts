import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cancelRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';

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
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const subscription = userDoc.data()?.subscription as Record<string, unknown> | undefined;
        const razorpaySubscriptionId = subscription?.razorpaySubscriptionId as string | undefined;

        if (razorpaySubscriptionId) {
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (!keyId || !keySecret) {
                throw {
                    status: 500,
                    error: 'Unable to cancel active billing before deleting account. Please contact support.',
                    code: 'billing-cancel-not-configured',
                };
            }

            try {
                await cancelRazorpaySubscription(razorpaySubscriptionId, keyId, keySecret, false);
            } catch (cancelError) {
                const message = cancelError instanceof Error ? cancelError.message : String(cancelError);
                if (!/cancelled|canceled|completed|not found/i.test(message)) {
                    console.error('[account/delete] Failed to cancel Razorpay subscription:', cancelError);
                    throw {
                        status: 502,
                        error: 'Unable to cancel active billing before deleting account. Please contact support.',
                        code: 'billing-cancel-failed',
                    };
                }
            }
        }

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
                userName: 'Deleted User',
                guestName: FieldValue.delete(),
                status: b.status === 'confirmed' && classDate >= today ? 'canceled' : b.status,
                canceledAt: b.status === 'confirmed' ? now : b.canceledAt ?? null,
                updatedAt: now,
                deletedByUser: true,
            });
        }

        const paymentsSnap = await adminDb
            .collection('payments')
            .where('userId', '==', userId)
            .get();

        for (const paymentDoc of paymentsSnap.docs) {
            await paymentDoc.ref.update({
                userId: 'deleted-user',
                deletedByUser: true,
                updatedAt: now,
            });
        }

        const leadsSnap = await adminDb
            .collection('introClassLeads')
            .where('userId', '==', userId)
            .get();

        for (const leadDoc of leadsSnap.docs) {
            await leadDoc.ref.update({
                userId: 'deleted-user',
                name: FieldValue.delete(),
                email: FieldValue.delete(),
                phone: FieldValue.delete(),
                deletedByUser: true,
                updatedAt: now,
            });
        }

        // Delete the Firestore user profile
        await userRef.delete();

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
