import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById, VALID_PLAN_IDS } from '@fitconnect/shared/types/subscription';
import { createRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Must be logged in', code: 'unauthenticated' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        const userId = decoded.uid;

        let body: Record<string, unknown>;
        try { body = await req.json(); }
        catch { return NextResponse.json({ error: 'Invalid request body', code: 'invalid-argument' }, { status: 400 }); }

        const planId = body.planId as string;
        if (!planId || !VALID_PLAN_IDS.includes(planId as typeof VALID_PLAN_IDS[number])) {
            return NextResponse.json(
                { error: `Invalid planId. Must be one of: ${VALID_PLAN_IDS.join(', ')}`, code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const plan = getPlanById(planId)!;

        if (plan.category !== 'membership') {
            return NextResponse.json(
                { error: 'Subscriptions are only available for membership plans. Use create-order for class packs.', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        if (!plan.razorpayPlanId) {
            return NextResponse.json(
                { error: `Plan '${planId}' is not yet configured for subscriptions. Run scripts/create-razorpay-plans.ts first.`, code: 'plan-not-configured' },
                { status: 503 },
            );
        }

        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data()! : null;

        if (userData) {
            const sub = userData.subscription;
            if (sub?.status === 'active' && sub?.planCategory === 'membership') {
                const endDate = sub.endDate?.toDate?.() || new Date(sub.endDate);
                if (endDate > new Date()) {
                    return NextResponse.json(
                        { error: 'You already have an active membership.', code: 'already-exists' },
                        { status: 409 },
                    );
                }
            }
        }

        const keyId = process.env.RAZORPAY_KEY_ID!;
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;

        const rzpSub = await createRazorpaySubscription(
            plan.razorpayPlanId,
            plan.razorpayTotalCount ?? 24,
            keyId,
            keySecret,
            { planId, userId },
        );

        const paymentRef = adminDb.collection('payments').doc();
        await paymentRef.set({
            id: paymentRef.id,
            razorpaySubscriptionId: rzpSub.id,
            userId,
            amount: plan.price,
            currency: 'INR',
            status: 'pending',
            planId,
            metadata: {
                planName: plan.name,
                planCategory: plan.category,
                credits: plan.credits,
                durationDays: plan.durationDays,
            },
            createdAt: new Date(),
            paidAt: null,
        });

        return NextResponse.json({
            subscriptionId: rzpSub.id,
            paymentId: paymentRef.id,
            amount: plan.price * 100,
            currency: 'INR',
            key: keyId,
        });
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        return NextResponse.json({ error: 'Failed to create subscription', code: 'internal' }, { status: 500 });
    }
}
