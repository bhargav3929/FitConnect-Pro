import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { verifyWebhookSignature, type RazorpaySubscriptionEntity } from '@fitconnect/shared/payments/razorpay-processor';
import { getPlanIdForRazorpayPlanId } from '@/lib/razorpay/pricing';

export const dynamic = 'force-dynamic';

interface RazorpayWebhookEvent {
    id?: string;
    event: string;
    created_at?: number;
    payload: Record<string, unknown>;
}

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

function fromUnixSeconds(value: unknown): Date | null {
    return typeof value === 'number' && value > 0 ? new Date(value * 1000) : null;
}

function extractSubscription(payload: Record<string, unknown>): RazorpaySubscriptionEntity | null {
    const subscription = payload.subscription as { entity?: RazorpaySubscriptionEntity } | undefined;
    return subscription?.entity ?? null;
}

function extractPayment(payload: Record<string, unknown>): Record<string, unknown> | null {
    const payment = payload.payment as { entity?: Record<string, unknown> } | undefined;
    return payment?.entity ?? null;
}

function getEventDocumentId(event: RazorpayWebhookEvent): string {
    const sub = extractSubscription(event.payload);
    const payment = extractPayment(event.payload);
    return event.id
        ?? `${event.event}:${sub?.id ?? payment?.id ?? 'unknown'}:${event.created_at ?? Date.now()}`;
}

async function registerWebhookEvent(event: RazorpayWebhookEvent): Promise<boolean> {
    const eventRef = adminDb.collection('razorpayWebhookEvents').doc(getEventDocumentId(event));
    return adminDb.runTransaction(async (transaction) => {
        const existing = await transaction.get(eventRef);
        if (existing.exists) return false;
        transaction.set(eventRef, {
            id: eventRef.id,
            event: event.event,
            receivedAt: FieldValue.serverTimestamp(),
            processedAt: null,
            status: 'processing',
        });
        return true;
    });
}

async function markWebhookEventProcessed(event: RazorpayWebhookEvent, status: 'processed' | 'failed', error?: unknown) {
    const eventRef = adminDb.collection('razorpayWebhookEvents').doc(getEventDocumentId(event));
    await eventRef.set({
        status,
        processedAt: FieldValue.serverTimestamp(),
        ...(error ? { error: error instanceof Error ? error.message : String(error) } : {}),
    }, { merge: true });
}

async function findUserRefForSubscription(subscriptionId: string): Promise<DocumentReference | null> {
    const userSnap = await adminDb
        .collection('users')
        .where('subscription.razorpaySubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

    if (!userSnap.empty) return userSnap.docs[0].ref;

    const paymentSnap = await adminDb
        .collection('payments')
        .where('razorpaySubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

    if (paymentSnap.empty) return null;
    const userId = paymentSnap.docs[0].data().userId as string | undefined;
    return userId ? adminDb.collection('users').doc(userId) : null;
}

async function markSubscriptionPayment(subscriptionId: string, status: 'succeeded' | 'failed', paymentId?: string) {
    const paymentSnap = await adminDb
        .collection('payments')
        .where('razorpaySubscriptionId', '==', subscriptionId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

    if (paymentSnap.empty) return null;
    const paymentRef = paymentSnap.docs[0].ref;
    await paymentRef.update({
        status,
        ...(paymentId ? { razorpayPaymentId: paymentId } : {}),
        paidAt: status === 'succeeded' ? FieldValue.serverTimestamp() : null,
        updatedAt: FieldValue.serverTimestamp(),
    });
    return paymentRef.id;
}

function getAccessWindow(sub: RazorpaySubscriptionEntity, durationDays: number): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = fromUnixSeconds(sub.current_start) ?? fromUnixSeconds(sub.start_at) ?? now;
    const endDate = fromUnixSeconds(sub.current_end) ?? fromUnixSeconds(sub.charge_at) ?? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
}

async function applySubscriptionAccess(
    sub: RazorpaySubscriptionEntity,
    options: { resetCredits: boolean; paymentId?: string; source: string },
) {
    const userRef = await findUserRefForSubscription(sub.id);
    if (!userRef) {
        console.warn(`[webhook] ${options.source}: no user found for subscriptionId=${sub.id}`);
        return;
    }

    const planId = await getPlanIdForRazorpayPlanId(sub.plan_id);
    const plan = planId ? getPlanById(planId) : null;
    if (!plan) {
        console.warn(`[webhook] ${options.source}: no app plan mapped for razorpayPlanId=${sub.plan_id}`);
        return;
    }

    const paymentDocId = options.paymentId ? await markSubscriptionPayment(sub.id, 'succeeded', options.paymentId) : null;
    const accessWindow = getAccessWindow(sub, plan.durationDays);

    await adminDb.runTransaction(async (transaction) => {
        const freshUserDoc = await transaction.get(userRef);
        if (!freshUserDoc.exists) return;

        const currentSub = freshUserDoc.data()?.subscription as Record<string, unknown> | undefined;
        const currentIntroCredit = typeof currentSub?.introCreditRemaining === 'number'
            ? Math.max(0, currentSub.introCreditRemaining)
            : 0;
        const existingClassesRemaining = currentSub?.classesRemaining as number | null | undefined;
        const existingGuestPasses = currentSub?.guestPassesRemaining as number | undefined;
        const renewalCanceled = (
            currentSub?.cancelAtPeriodEnd === true ||
            sub.cancel_at_cycle_end === true
        ) && accessWindow.endDate > new Date();
        const shouldCarryKickstarterCredits =
            options.source === 'subscription.activated' &&
            currentSub?.planId === 'kickstarter' &&
            currentSub?.kickstarterCreditsCarriedForward !== true &&
            typeof currentSub.classesRemaining === 'number' &&
            currentSub.classesRemaining > 0;
        const carriedKickstarterCredits = shouldCarryKickstarterCredits
            ? Math.max(0, currentSub.classesRemaining as number)
            : 0;
        const activationCredits = typeof plan.credits === 'number'
            ? plan.credits + carriedKickstarterCredits
            : plan.credits;
        const nextClassesRemaining = options.resetCredits
            ? plan.credits
            : existingClassesRemaining ?? activationCredits;

        transaction.update(userRef, {
            'subscription.planId': plan.id,
            'subscription.planCategory': plan.category,
            'subscription.startDate': accessWindow.startDate,
            'subscription.endDate': accessWindow.endDate,
            'subscription.status': 'active',
            'subscription.classesRemaining': nextClassesRemaining,
            'subscription.introCreditRemaining': currentIntroCredit,
            'subscription.maxClassesPerDay': plan.maxClassesPerDay,
            'subscription.weeklyClassLimit': plan.weeklyClassLimit,
            'subscription.advanceBookingDays': plan.advanceBookingDays,
            'subscription.guestPassesRemaining': options.resetCredits ? plan.guestPasses : existingGuestPasses ?? plan.guestPasses,
            'subscription.lastPaymentId': paymentDocId ?? currentSub?.lastPaymentId ?? null,
            'subscription.autoRenew': !renewalCanceled,
            'subscription.cancelAtPeriodEnd': renewalCanceled,
            'subscription.canceledAt': null,
            'subscription.razorpaySubscriptionId': sub.id,
            'subscription.razorpayPlanId': sub.plan_id,
            'subscription.kickstarterCreditsCarriedForward': currentSub?.kickstarterCreditsCarriedForward === true || carriedKickstarterCredits > 0,
            'subscription.carriedForwardCredits': carriedKickstarterCredits > 0 ? carriedKickstarterCredits : currentSub?.carriedForwardCredits ?? 0,
            'subscription.pendingPlanId': sub.has_scheduled_changes ? currentSub?.pendingPlanId ?? null : null,
            'subscription.pendingRazorpayPlanId': sub.has_scheduled_changes ? currentSub?.pendingRazorpayPlanId ?? null : null,
            'subscription.pendingPlanEffectiveAt': sub.has_scheduled_changes
                ? fromUnixSeconds(sub.change_scheduled_at) ?? currentSub?.pendingPlanEffectiveAt ?? null
                : null,
            'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
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

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    const shouldProcess = await registerWebhookEvent(event);
    if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

    try {
        switch (event.event) {
            case 'subscription.activated':
                await handleSubscriptionActivated(event.payload);
                break;
            case 'subscription.charged':
            case 'invoice.paid':
                await handleSubscriptionCharged(event.payload);
                break;
            case 'subscription.updated':
                await handleSubscriptionUpdated(event.payload);
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
            default:
                break;
        }
        await markWebhookEventProcessed(event, 'processed');
    } catch (error) {
        console.error(`[webhook] Error handling ${event.event}:`, error);
        await markWebhookEventProcessed(event, 'failed', error);
    }

    return NextResponse.json({ received: true });
}

async function handleSubscriptionActivated(payload: Record<string, unknown>) {
    const sub = extractSubscription(payload);
    if (!sub) return;
    await applySubscriptionAccess(sub, { resetCredits: false, source: 'subscription.activated' });
}

async function handleSubscriptionCharged(payload: Record<string, unknown>) {
    const sub = extractSubscription(payload);
    if (!sub) return;
    const payment = extractPayment(payload);
    await applySubscriptionAccess(sub, {
        resetCredits: true,
        paymentId: typeof payment?.id === 'string' ? payment.id : undefined,
        source: 'subscription.charged',
    });
}

async function handleSubscriptionUpdated(payload: Record<string, unknown>) {
    const sub = extractSubscription(payload);
    if (!sub) return;

    if (sub.has_scheduled_changes) {
        const userRef = await findUserRefForSubscription(sub.id);
        if (!userRef) return;
        const pendingPlanId = await getPlanIdForRazorpayPlanId(sub.plan_id);

        await userRef.update({
            'subscription.pendingPlanId': pendingPlanId,
            'subscription.pendingRazorpayPlanId': sub.plan_id,
            'subscription.pendingPlanEffectiveAt': fromUnixSeconds(sub.change_scheduled_at),
            'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return;
    }

    // A mid-cycle plan update should preserve the app-calculated credit balance.
    // Renewals are handled by subscription.charged / invoice.paid, which resets credits.
    await applySubscriptionAccess(sub, { resetCredits: false, source: 'subscription.updated' });
}

async function handleSubscriptionHalted(payload: Record<string, unknown>) {
    const sub = extractSubscription(payload);
    if (!sub) return;

    const userRef = await findUserRefForSubscription(sub.id);
    if (!userRef) return;

    await userRef.update({
        'subscription.status': 'halted',
        'subscription.autoRenew': false,
        'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

async function handleSubscriptionCancelled(payload: Record<string, unknown>) {
    const sub = extractSubscription(payload);
    if (!sub) return;

    const userRef = await findUserRefForSubscription(sub.id);
    if (!userRef) return;

    await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(userRef);
        if (!doc.exists) return;
        const subscription = doc.data()?.subscription as Record<string, unknown> | undefined;
        const endDate = toDate(subscription?.endDate) ?? fromUnixSeconds(sub.current_end) ?? fromUnixSeconds(sub.ended_at);
        const isStillUsable = !!endDate && endDate > new Date();

        transaction.update(userRef, {
            'subscription.status': isStillUsable ? 'active' : 'canceled',
            'subscription.autoRenew': false,
            'subscription.cancelAtPeriodEnd': isStillUsable,
            'subscription.canceledAt': subscription?.canceledAt ?? FieldValue.serverTimestamp(),
            'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}

async function handleSubscriptionCompleted(payload: Record<string, unknown>) {
    const sub = extractSubscription(payload);
    if (!sub) return;

    const userRef = await findUserRefForSubscription(sub.id);
    if (!userRef) return;

    await userRef.update({
        'subscription.autoRenew': false,
        'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
    const payment = extractPayment(payload);
    if (!payment) return;

    const subscriptionId = typeof payment.subscription_id === 'string'
        ? payment.subscription_id
        : typeof payment.invoice_id === 'string'
            ? payment.invoice_id
            : null;

    await adminDb.collection('paymentFailures').add({
        razorpayPaymentId: payment.id ?? null,
        orderId: payment.order_id ?? null,
        subscriptionId,
        errorDescription: payment.error_description ?? payment.description ?? null,
        recordedAt: FieldValue.serverTimestamp(),
    });

    if (subscriptionId) {
        await markSubscriptionPayment(subscriptionId, 'failed', typeof payment.id === 'string' ? payment.id : undefined);
    }
}
