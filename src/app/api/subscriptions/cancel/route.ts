import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cancelRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Must be logged in', code: 'unauthenticated' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        const userId = decoded.uid;

        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found', code: 'not-found' }, { status: 404 });
        }

        const subscription = userDoc.data()?.subscription as Record<string, unknown> | undefined;
        if (!subscription || subscription.status !== 'active') {
            return NextResponse.json({ error: 'No active subscription to cancel', code: 'failed-precondition' }, { status: 400 });
        }

        const razorpaySubscriptionId = subscription.razorpaySubscriptionId as string | null;

        // Cancel on Razorpay if a subscription ID exists (memberships)
        if (razorpaySubscriptionId) {
            try {
                await cancelRazorpaySubscription(
                    razorpaySubscriptionId,
                    process.env.RAZORPAY_KEY_ID!,
                    process.env.RAZORPAY_KEY_SECRET!,
                    true, // cancel at end of billing cycle, not immediately
                );
            } catch (rzpErr) {
                console.error('[cancel] Razorpay cancel failed:', rzpErr);
                // Still mark locally — Razorpay may have already cancelled or subscription may be expired
            }
        }

        await userRef.update({
            'subscription.status': 'canceled',
            'subscription.autoRenew': false,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription', code: 'internal' }, { status: 500 });
    }
}
