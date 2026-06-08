import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { verifyPaymentSignature } from '@fitconnect/shared/payments/razorpay-processor';
import { FieldValue } from 'firebase-admin/firestore';

function isActiveUnexpiredSubscription(subscription: Record<string, unknown> | undefined | null): boolean {
    if (!subscription || subscription.status !== 'active') return false;
    if (!subscription.endDate) return true;
    const endDate = subscription.endDate && typeof subscription.endDate === 'object' && 'toDate' in subscription.endDate
        ? (subscription.endDate as { toDate: () => Date }).toDate()
        : new Date((subscription.endDate as string | number | Date | undefined) || 0);
    return endDate > new Date();
}

function isActiveMembership(subscription: Record<string, unknown> | undefined | null): boolean {
    const plan = subscription?.planId ? getPlanById(subscription.planId as string) : null;
    return isActiveUnexpiredSubscription(subscription) && (subscription?.planCategory === 'membership' || plan?.category === 'membership');
}

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

        const paymentRef = adminDb.collection('payments').doc(paymentId);
        const userRef = adminDb.collection('users').doc(userId);

        const result = await adminDb.runTransaction(async (transaction) => {
            const paymentDoc = await transaction.get(paymentRef);
            const userDoc = await transaction.get(userRef);

            if (!paymentDoc.exists) {
                throw { status: 404, error: 'Payment not found', code: 'not-found' };
            }
            if (!userDoc.exists) {
                throw { status: 404, error: 'User not found', code: 'not-found' };
            }

            const paymentData = paymentDoc.data()!;

            if (paymentData.userId !== userId) {
                throw { status: 403, error: 'Payment does not belong to you', code: 'permission-denied' };
            }

            if (paymentData.status !== 'pending') {
                throw { status: 400, error: `Payment is already ${paymentData.status}`, code: 'failed-precondition' };
            }

            const plan = getPlanById(paymentData.planId);
            if (!plan) {
                throw { status: 400, error: 'Invalid plan on payment', code: 'failed-precondition' };
            }

            const currentSub = userDoc.data()!.subscription as Record<string, unknown> | undefined;
            const currentIntroCredit = typeof currentSub?.introCreditRemaining === 'number'
                ? Math.max(0, currentSub.introCreditRemaining)
                : 0;

            if (plan.category === 'membership') {
                if (isActiveUnexpiredSubscription(currentSub)) {
                    throw { status: 400, error: 'You already have an active membership.', code: 'subscription-already-active' };
                }
            }

            if (plan.category === 'class_pack' && plan.id !== 'drop_in' && isActiveMembership(currentSub)) {
                throw { status: 400, error: 'Starter packs are only available before an active membership.', code: 'subscription-already-active' };
            }

            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + plan.durationDays);

            transaction.update(paymentRef, {
                status: 'succeeded',
                razorpayPaymentId: razorpay_payment_id,
                paidAt: now,
            });

            transaction.update(userRef, {
                'subscription.planId': plan.id,
                'subscription.planCategory': plan.category,
                'subscription.startDate': now,
                'subscription.endDate': endDate,
                'subscription.status': 'active',
                'subscription.classesRemaining': plan.id === 'drop_in' ? 0 : plan.credits,
                'subscription.introCreditRemaining': plan.id === 'drop_in' ? 1 : currentIntroCredit,
                'subscription.maxClassesPerDay': plan.maxClassesPerDay,
                'subscription.weeklyClassLimit': plan.weeklyClassLimit,
                'subscription.advanceBookingDays': plan.advanceBookingDays,
                'subscription.guestPassesRemaining': plan.guestPasses,
                'subscription.lastPaymentId': paymentRef.id,
                'subscription.autoRenew': plan.autoRenew,
                updatedAt: FieldValue.serverTimestamp(),
            });

            if (plan.id === 'drop_in') {
                const metadata = paymentData.metadata as Record<string, unknown> | undefined;
                const lead = metadata?.introClassLead && typeof metadata.introClassLead === 'object'
                    ? metadata.introClassLead as Record<string, unknown>
                    : {};
                const leadRef = adminDb.collection('introClassLeads').doc(userId);

                transaction.set(leadRef, {
                    name: typeof lead.name === 'string' ? lead.name : userDoc.data()!.name ?? decoded.name ?? '',
                    email: typeof lead.email === 'string' ? lead.email : decoded.email ?? '',
                    phone: typeof lead.phone === 'string' ? lead.phone : '',
                    goals: typeof lead.goals === 'string' ? lead.goals : '',
                    concerns: typeof lead.concerns === 'string' ? lead.concerns : '',
                    userId,
                    source: typeof lead.source === 'string' ? lead.source : 'intro-class-payment',
                    status: 'new',
                    paymentStatus: 'paid',
                    paymentId: paymentRef.id,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
            }

            return {
                endDate: endDate.toISOString(),
                planId: plan.id,
                planName: plan.name,
                credits: plan.credits,
            };
        });

        return NextResponse.json({
            success: true,
            endDate: result.endDate,
            planId: result.planId,
            planName: result.planName,
            credits: result.credits,
        });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment', code: 'internal' },
            { status: 500 },
        );
    }
}
