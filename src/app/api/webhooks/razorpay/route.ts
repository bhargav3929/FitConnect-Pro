import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { verifyWebhookSignature } from '@fitconnect/shared/payments/razorpay-processor';
import { FieldValue } from 'firebase-admin/firestore';

// Razorpay sends the raw body — Next.js must not parse it before we verify.
export const dynamic = 'force-dynamic';

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
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing signature header', code: 'unauthorized' }, { status: 400 });
    }

    const rawBody = await req.text();

    const isValid = verifyWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET!);
    if (!isValid) {
        return NextResponse.json({ error: 'Webhook signature verification failed', code: 'signature-invalid' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as { event: string; payload: Record<string, unknown> };

    try {
        switch (event.event) {
            case 'subscription.charged':
                await handleSubscriptionCharged(event.payload);
                break;
            case 'subscription.halted':
                await handleSubscriptionHalted(event.payload);
                break;
            case 'subscription.cancelled':
                await handleSubscriptionCancelled(event.payload);
                break;
            case 'subscription.completed':
                await handleSubscriptionCompleted(event.payload);
                break;
            case 'payment.failed':
                await handlePaymentFailed(event.payload);
                break;
            // subscription.activated — no action needed, verify-subscription already handles activation
            default:
                break;
        }
    } catch (error) {
        console.error(`[webhook] Error handling ${event.event}:`, error);
        // Still return 200 — Razorpay retries on non-200, don't create retry loops for business logic errors
    }

    return NextResponse.json({ received: true });
}

async function handleSubscriptionCharged(payload: Record<string, unknown>) {
    const sub = (payload.subscription as { entity: { id: string; plan_id: string } }).entity;
    const subscriptionId = sub.id;

    // Find user by their Razorpay subscription ID
    const userSnap = await adminDb
        .collection('users')
        .where('subscription.razorpaySubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

    if (userSnap.empty) {
        console.warn(`[webhook] subscription.charged: no user found for subscriptionId=${subscriptionId}`);
        return;
    }

    const userDoc = userSnap.docs[0];
    const userRef = userDoc.ref;

    await adminDb.runTransaction(async (transaction) => {
        const freshUserDoc = await transaction.get(userRef);
        if (!freshUserDoc.exists) return;

        const currentSub = freshUserDoc.data()?.subscription;
        if (!currentSub?.planId) {
            console.warn(`[webhook] subscription.charged: user ${userRef.id} has no planId, skipping renewal`);
            return;
        }
        const plan = getPlanById(currentSub.planId);
        if (!plan) return;

        // Extend end date from today (catches up if payment was late)
        const now = new Date();
        const newEndDate = new Date(now);
        newEndDate.setDate(newEndDate.getDate() + plan.durationDays);

        transaction.update(userRef, {
            'subscription.status': 'active',
            'subscription.endDate': newEndDate,
            'subscription.classesRemaining': plan.credits,
            'subscription.weeklyClassLimit': plan.weeklyClassLimit,
            'subscription.guestPassesRemaining': plan.guestPasses,
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}

async function handleSubscriptionHalted(payload: Record<string, unknown>) {
    const sub = (payload.subscription as { entity: { id: string } }).entity;
    const subscriptionId = sub.id;

    const userSnap = await adminDb
        .collection('users')
        .where('subscription.razorpaySubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

    if (userSnap.empty) {
        console.warn(`[webhook] subscription.halted: no user found for subscriptionId=${subscriptionId}`);
        return;
    }

    const userRef = userSnap.docs[0].ref;
    await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        if (!doc.exists) return;
        transaction.update(userRef, {
            'subscription.status': 'expiring_soon',
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}

async function handleSubscriptionCancelled(payload: Record<string, unknown>) {
    const sub = (payload.subscription as { entity: { id: string } }).entity;
    const subscriptionId = sub.id;

    const userSnap = await adminDb
        .collection('users')
        .where('subscription.razorpaySubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

    if (userSnap.empty) {
        console.warn(`[webhook] subscription.cancelled: no user found for subscriptionId=${subscriptionId}`);
        return;
    }

    const userRef = userSnap.docs[0].ref;
    await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        if (!doc.exists) return;
        const subscription = doc.data()?.subscription;
        const endDate = toDate(subscription?.endDate);
        const isStillUsable = !!endDate && endDate > new Date();

        transaction.update(userRef, {
            'subscription.status': isStillUsable ? 'active' : 'canceled',
            'subscription.autoRenew': false,
            'subscription.cancelAtPeriodEnd': isStillUsable,
            'subscription.canceledAt': subscription?.canceledAt ?? FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}

async function handleSubscriptionCompleted(payload: Record<string, unknown>) {
    // All billing cycles exhausted — let the subscription expire at endDate naturally.
    // Just disable autoRenew so the UI shows it correctly.
    const sub = (payload.subscription as { entity: { id: string } }).entity;
    const subscriptionId = sub.id;

    const userSnap = await adminDb
        .collection('users')
        .where('subscription.razorpaySubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

    if (userSnap.empty) {
        console.warn(`[webhook] subscription.completed: no user found for subscriptionId=${subscriptionId}`);
        return;
    }

    const userRef = userSnap.docs[0].ref;
    await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        if (!doc.exists) return;
        transaction.update(userRef, {
            'subscription.autoRenew': false,
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
    // Log to Firestore for visibility — no user-facing action (Razorpay handles retries)
    const payment = (payload.payment as { entity: { id: string; order_id?: string; description?: string; error_description?: string } }).entity;
    try {
        await adminDb.collection('paymentFailures').add({
            razorpayPaymentId: payment.id,
            orderId: payment.order_id ?? null,
            errorDescription: payment.error_description ?? payment.description ?? null,
            recordedAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error('[webhook] payment.failed: failed to log:', err);
    }
}
