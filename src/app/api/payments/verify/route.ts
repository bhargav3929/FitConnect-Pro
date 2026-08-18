import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { verifyPaymentSignature } from '@fitconnect/shared/payments/razorpay-processor';
import { grantOrderAccess } from '@/lib/payments/order-access';

export async function POST(req: NextRequest) {
    try {
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

        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = body as {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
            paymentId?: string;
        };

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            process.env.RAZORPAY_KEY_SECRET!,
        );

        if (!isValid) {
            return NextResponse.json(
                { error: 'Payment signature verification failed', code: 'signature-invalid' },
                { status: 400 },
            );
        }

        if (!paymentId || typeof paymentId !== 'string') {
            return NextResponse.json(
                { error: 'paymentId is required', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const result = await grantOrderAccess({
            paymentRef: adminDb.collection('payments').doc(paymentId),
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            expectedUserId: userId,
            identity: { name: decoded.name as string | undefined, email: decoded.email },
            source: 'checkout-callback',
        });

        if (result.status === 'conflict') {
            const status = result.code === 'not-found' ? 404 : result.code === 'permission-denied' ? 403 : 400;
            return NextResponse.json({ error: result.message, code: result.code }, { status });
        }

        return NextResponse.json({
            success: true,
            endDate: result.endDate,
            planId: result.planId,
            planName: result.planName,
            credits: result.credits,
        });
    } catch (error: unknown) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment', code: 'internal' },
            { status: 500 },
        );
    }
}
