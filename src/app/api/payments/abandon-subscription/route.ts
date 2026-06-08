import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cancelRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Must be logged in', code: 'unauthenticated' }, { status: 401 });
        }

        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        const userId = decoded.uid;

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body', code: 'invalid-argument' }, { status: 400 });
        }

        const paymentId = body.paymentId as string | undefined;
        const razorpaySubscriptionId = body.subscriptionId as string | undefined;
        if (!paymentId || !razorpaySubscriptionId) {
            return NextResponse.json(
                { error: 'paymentId and subscriptionId are required', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const paymentRef = adminDb.collection('payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();
        if (!paymentDoc.exists) {
            return NextResponse.json({ error: 'Payment not found', code: 'not-found' }, { status: 404 });
        }

        const payment = paymentDoc.data()!;
        if (payment.userId !== userId || payment.razorpaySubscriptionId !== razorpaySubscriptionId) {
            return NextResponse.json({ error: 'Payment does not belong to you', code: 'permission-denied' }, { status: 403 });
        }

        if (payment.status !== 'pending') {
            return NextResponse.json({ success: true, skipped: true, status: payment.status });
        }

        let razorpayCancelled = false;
        let razorpayCancelError: string | null = null;
        try {
            await cancelRazorpaySubscription(
                razorpaySubscriptionId,
                process.env.RAZORPAY_KEY_ID!,
                process.env.RAZORPAY_KEY_SECRET!,
                false,
            );
            razorpayCancelled = true;
        } catch (error) {
            razorpayCancelError = error instanceof Error ? error.message : String(error);
            console.warn('[abandon-subscription] Razorpay cancel failed:', error);
        }

        await paymentRef.update({
            status: 'abandoned',
            abandonedAt: FieldValue.serverTimestamp(),
            razorpayCancelled,
            razorpayCancelError,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, razorpayCancelled });
    } catch (error) {
        console.error('[abandon-subscription] Failed:', error);
        return NextResponse.json({ error: 'Failed to abandon subscription checkout', code: 'internal' }, { status: 500 });
    }
}
