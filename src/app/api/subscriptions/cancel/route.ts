import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { cancelRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { FieldValue } from 'firebase-admin/firestore';

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'object' && 'seconds' in value) {
        return new Date((value as { seconds: number }).seconds * 1000);
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
}

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

        const plan = subscription.planId ? getPlanById(subscription.planId as string) : null;
        const isMembership = subscription.planCategory === 'membership' || plan?.category === 'membership';
        const razorpaySubscriptionId = subscription.razorpaySubscriptionId as string | null;

        if (!isMembership) {
            return NextResponse.json(
                {
                    error: 'Class packs do not auto-renew. Credits remain usable until the plan expires.',
                    code: 'non-renewing-plan',
                },
                { status: 400 },
            );
        }

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

        const endDate = toDate(subscription.endDate);
        const isStillUsable = !!endDate && endDate > new Date();

        await userRef.update({
            'subscription.status': isStillUsable ? 'active' : 'canceled',
            'subscription.autoRenew': false,
            'subscription.cancelAtPeriodEnd': isStillUsable,
            'subscription.canceledAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, mode: isStillUsable ? 'period_end' : 'immediate' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription', code: 'internal' }, { status: 500 });
    }
}
