import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById, VALID_PLAN_IDS } from '@fitconnect/shared/types/subscription';
import { createRazorpayOrder } from '@fitconnect/shared/payments/razorpay-processor';

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

        const planId = body.planId as string;
        if (!planId || !VALID_PLAN_IDS.includes(planId as typeof VALID_PLAN_IDS[number])) {
            return NextResponse.json(
                { error: `Invalid planId. Must be one of: ${VALID_PLAN_IDS.join(', ')}`, code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const plan = getPlanById(planId)!;

        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data()! : null;

        if (plan.category === 'membership' && userData) {
            const sub = userData.subscription;
            if (sub?.status === 'active' && sub?.planCategory === 'membership') {
                const endDate = sub.endDate?.toDate?.() || new Date(sub.endDate);
                if (endDate > new Date()) {
                    return NextResponse.json(
                        { error: 'You already have an active membership. Wait for it to expire or cancel first.', code: 'already-exists' },
                        { status: 409 },
                    );
                }
            }
        }

        const isFoundingMember = userData?.isFoundingMember === true;
        const chargeAmount = (isFoundingMember && plan.foundingPrice) ? plan.foundingPrice : plan.price;

        const keyId = process.env.RAZORPAY_KEY_ID!;
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;

        const order = await createRazorpayOrder(chargeAmount, planId, keyId, keySecret);

        const paymentRef = adminDb.collection('payments').doc();
        const now = new Date();

        await paymentRef.set({
            id: paymentRef.id,
            razorpayOrderId: order.id,
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
            },
            createdAt: now,
            paidAt: null,
        });

        return NextResponse.json({
            orderId: order.id,
            paymentId: paymentRef.id,
            amount: order.amount,
            currency: order.currency,
            key: keyId,
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            { error: 'Failed to create payment order', code: 'internal' },
            { status: 500 },
        );
    }
}
