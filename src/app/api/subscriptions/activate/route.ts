import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById, LEGACY_PLAN_MAP, VALID_PLAN_IDS, type PlanId } from '@fitconnect/shared/types/subscription';
import { FieldValue } from 'firebase-admin/firestore';
import { processPayment } from '@fitconnect/shared/payments/mock-processor';

export async function POST(req: NextRequest) {
    try {
        // Auth
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

        // Accept both old planType and new planId
        let planId: PlanId;
        if (body.planId && VALID_PLAN_IDS.includes(body.planId as PlanId)) {
            planId = body.planId as PlanId;
        } else if (body.planType && typeof body.planType === 'string') {
            // Legacy mapping
            const mapped = LEGACY_PLAN_MAP[body.planType];
            if (!mapped) {
                return NextResponse.json(
                    { error: 'Invalid plan type', code: 'invalid-argument' },
                    { status: 400 },
                );
            }
            planId = mapped;
        } else {
            return NextResponse.json(
                { error: 'planId or planType is required', code: 'invalid-argument' },
                { status: 400 },
            );
        }

        const plan = getPlanById(planId)!;

        // Verify user exists
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'User profile not found', code: 'not-found' },
                { status: 404 },
            );
        }

        // Process mock payment
        const paymentResult = await processPayment(plan.price);

        // Create payment record
        const paymentRef = adminDb.collection('payments').doc();
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + plan.durationDays);

        await paymentRef.set({
            id: paymentRef.id,
            paymentIntentId: paymentResult.paymentIntentId,
            userId,
            amount: plan.price,
            currency: 'usd',
            status: paymentResult.success ? 'succeeded' : 'failed',
            planId,
            metadata: {
                planName: plan.name,
                planCategory: plan.category,
                credits: plan.credits,
                durationDays: plan.durationDays,
            },
            createdAt: now,
            paidAt: paymentResult.success ? now : null,
        });

        if (!paymentResult.success) {
            return NextResponse.json(
                { error: paymentResult.error || 'Payment failed', code: 'payment-failed' },
                { status: 402 },
            );
        }

        // Update user subscription
        await userRef.update({
            'subscription.planId': plan.id,
            'subscription.planCategory': plan.category,
            'subscription.startDate': now,
            'subscription.endDate': endDate,
            'subscription.status': 'active',
            'subscription.classesRemaining': plan.credits,
            'subscription.maxClassesPerDay': plan.maxClassesPerDay,
            'subscription.advanceBookingDays': plan.advanceBookingDays,
            'subscription.guestPassesRemaining': plan.guestPasses,
            'subscription.lastPaymentId': paymentRef.id,
            'updatedAt': FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, endDate: endDate.toISOString() });
    } catch (error) {
        console.error('Error activating subscription:', error);
        return NextResponse.json(
            { error: 'Failed to activate subscription', code: 'internal' },
            { status: 500 },
        );
    }
}
