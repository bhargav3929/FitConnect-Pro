import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { fetchRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Must be logged in', code: 'unauthenticated' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        const userId = decoded.uid;

        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found', code: 'not-found' }, { status: 404 });
        }

        const subscription = userDoc.data()?.subscription as Record<string, unknown> | undefined;
        const razorpaySubscriptionId = subscription?.razorpaySubscriptionId as string | null;

        if (!razorpaySubscriptionId) {
            return NextResponse.json(
                { error: 'No Razorpay subscription found. Class pack purchases cannot be managed via the portal.', code: 'not-found' },
                { status: 404 },
            );
        }

        const rzpSub = await fetchRazorpaySubscription(
            razorpaySubscriptionId,
            process.env.RAZORPAY_KEY_ID!,
            process.env.RAZORPAY_KEY_SECRET!,
        );

        if (!rzpSub.short_url) {
            return NextResponse.json(
                { error: 'Razorpay did not return a subscription management link.', code: 'not-found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ url: rzpSub.short_url, status: rzpSub.status });
    } catch (error) {
        console.error('Error fetching portal link:', error);
        return NextResponse.json({ error: 'Failed to fetch portal link', code: 'internal' }, { status: 500 });
    }
}
