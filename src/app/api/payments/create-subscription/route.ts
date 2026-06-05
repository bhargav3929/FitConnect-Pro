import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById, VALID_PLAN_IDS } from '@fitconnect/shared/types/subscription';
import { createRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { getSyncedPlanEntry } from '@/lib/razorpay/pricing';

function isActiveUnexpiredSubscription(subscription: Record<string, unknown> | undefined | null): boolean {
    if (!subscription || subscription.status !== 'active') return false;
    if (!subscription.endDate) return true;
    const endDate = subscription.endDate && typeof subscription.endDate === 'object' && 'toDate' in subscription.endDate
        ? (subscription.endDate as { toDate: () => Date }).toDate()
        : new Date((subscription.endDate as string | number | Date | undefined) || 0);
    return endDate > new Date();
}

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

        const syncedPlan = await getSyncedPlanEntry(planId);
        const razorpayPlanId = syncedPlan?.razorpayPlanId ?? plan.razorpayPlanId;
        const chargeAmount = syncedPlan?.price ?? plan.price;

        if (!razorpayPlanId) {
            return NextResponse.json(
                {
                    error: `Plan '${planId}' is not yet configured for subscriptions. Visit /api/subscriptions/pricing to sync plans from Razorpay.`,
                    code: 'plan-not-configured',
                },
                { status: 503 },
            );
        }

        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data()! : null;

        if (isActiveUnexpiredSubscription(userData?.subscription)) {
            return NextResponse.json(
                { error: 'You already have an active membership.', code: 'already-exists' },
                { status: 409 },
            );
        }

        const keyId = process.env.RAZORPAY_KEY_ID!;
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;

        const rzpSub = await createRazorpaySubscription(
            razorpayPlanId,
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
            amount: chargeAmount,
            currency: 'INR',
            status: 'pending',
            planId,
            metadata: {
                planName: plan.name,
                planCategory: plan.category,
                credits: plan.credits,
                durationDays: plan.durationDays,
                listPrice: chargeAmount,
                pricingSource: syncedPlan?.source ?? 'static',
                razorpayPlanId,
                razorpayItemId: syncedPlan?.razorpayItemId ?? null,
            },
            createdAt: new Date(),
            paidAt: null,
        });

        return NextResponse.json({
            subscriptionId: rzpSub.id,
            paymentId: paymentRef.id,
            amount: chargeAmount * 100,
            currency: 'INR',
            key: keyId,
        });
    } catch (error) {
        console.error('Error creating Razorpay subscription:', error);
        return NextResponse.json({ error: 'Failed to create subscription', code: 'internal' }, { status: 500 });
    }
}
