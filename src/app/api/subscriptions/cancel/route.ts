import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { cancelRazorpaySubscription, fetchRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { CANCELLATION_NOTICE_DAYS, meetsCancellationNotice } from '@fitconnect/shared/subscriptions/policy';
import { FieldValue } from 'firebase-admin/firestore';
import { recordSubscriptionEvent, subscriptionChanges } from '@/lib/subscription-events';

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

const DAY_MS = 24 * 60 * 60 * 1000;

/** When Razorpay will next charge, falling back to the local end date minus frozen days. */
async function getNextChargeAt(razorpaySubscriptionId: string, subscription: Record<string, unknown>): Promise<Date | null> {
    try {
        const rzpSub = await fetchRazorpaySubscription(
            razorpaySubscriptionId,
            process.env.RAZORPAY_KEY_ID!,
            process.env.RAZORPAY_KEY_SECRET!,
        );
        if (rzpSub.status !== 'active' && rzpSub.status !== 'authenticated' && rzpSub.status !== 'pending') return null;
        const at = rzpSub.charge_at ?? rzpSub.current_end;
        if (typeof at === 'number' && at > 0) return new Date(at * 1000);
    } catch (error) {
        console.error('[cancel] Razorpay fetch failed, using local dates:', error);
    }
    const endDate = toDate(subscription.endDate);
    const offset = typeof subscription.accessOffsetDays === 'number' ? subscription.accessOffsetDays : 0;
    return endDate ? new Date(endDate.getTime() - offset * DAY_MS) : null;
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

        if (subscription.cancelAfterNextCharge === true || subscription.cancelAtPeriodEnd === true) {
            return NextResponse.json(
                { error: 'Your membership is already set to end.', code: 'already-canceled' },
                { status: 409 },
            );
        }

        // Cancellation needs CANCELLATION_NOTICE_DAYS before the next charge. With
        // less notice the next charge still happens, and renewal is stopped once it
        // lands (see isDeferredCancelDue in the webhook and sync paths).
        if (razorpaySubscriptionId) {
            const nextChargeAt = await getNextChargeAt(razorpaySubscriptionId, subscription);
            if (nextChargeAt && nextChargeAt > new Date() && !meetsCancellationNotice(nextChargeAt)) {
                const deferredUpdate = {
                    'subscription.cancelAfterNextCharge': true,
                    'subscription.cancelRequestedAt': FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                };
                const deferredBatch = adminDb.batch();
                deferredBatch.update(userRef, deferredUpdate);
                recordSubscriptionEvent(deferredBatch, {
                    userId,
                    action: 'cancel-scheduled',
                    source: 'member',
                    reason: `Member cancelled with less than ${CANCELLATION_NOTICE_DAYS} days' notice; the charge on ${nextChargeAt.toISOString()} still applies and renewal stops after it`,
                    actorId: userId,
                    razorpaySubscriptionId,
                    before: subscription,
                    changes: subscriptionChanges(deferredUpdate),
                    metadata: { route: 'subscriptions/cancel', nextChargeAt: nextChargeAt.toISOString() },
                });
                await deferredBatch.commit();
                return NextResponse.json({ success: true, mode: 'after_next_charge', nextChargeAt: nextChargeAt.toISOString() });
            }
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

        const userUpdate = {
            'subscription.status': isStillUsable ? 'active' : 'canceled',
            'subscription.autoRenew': false,
            'subscription.cancelAtPeriodEnd': isStillUsable,
            'subscription.canceledAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        const batch = adminDb.batch();
        batch.update(userRef, userUpdate);
        recordSubscriptionEvent(batch, {
            userId,
            action: 'plan-canceled',
            source: 'member',
            reason: isStillUsable
                ? `Member canceled renewal; access continues until ${endDate!.toISOString()}`
                : 'Member canceled an already-ended plan; marked canceled immediately',
            actorId: userId,
            razorpaySubscriptionId: razorpaySubscriptionId ?? null,
            before: subscription,
            changes: subscriptionChanges(userUpdate),
            metadata: { route: 'subscriptions/cancel' },
        });
        await batch.commit();

        return NextResponse.json({ success: true, mode: isStillUsable ? 'period_end' : 'immediate' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription', code: 'internal' }, { status: 500 });
    }
}

// DELETE - withdraw a cancellation that is still waiting on the next charge.
export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Must be logged in', code: 'unauthenticated' }, { status: 401 });
        }
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        const userId = decoded.uid;
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const subscription = userDoc.data()?.subscription as Record<string, unknown> | undefined;
        if (!subscription || subscription.cancelAfterNextCharge !== true) {
            return NextResponse.json(
                { error: 'There is no pending cancellation to withdraw.', code: 'failed-precondition' },
                { status: 400 },
            );
        }

        const update = {
            'subscription.cancelAfterNextCharge': false,
            'subscription.cancelRequestedAt': null,
            updatedAt: FieldValue.serverTimestamp(),
        };
        const batch = adminDb.batch();
        batch.update(userRef, update);
        recordSubscriptionEvent(batch, {
            userId,
            action: 'cancel-scheduled',
            source: 'member',
            reason: 'Member withdrew their pending cancellation; the membership keeps renewing',
            actorId: userId,
            razorpaySubscriptionId: (subscription.razorpaySubscriptionId as string | undefined) ?? null,
            before: subscription,
            changes: subscriptionChanges(update),
            metadata: { route: 'subscriptions/cancel', withdrawn: true },
        });
        await batch.commit();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error withdrawing cancellation:', error);
        return NextResponse.json({ error: 'Failed to withdraw cancellation', code: 'internal' }, { status: 500 });
    }
}
