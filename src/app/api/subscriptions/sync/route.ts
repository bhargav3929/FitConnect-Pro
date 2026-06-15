import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { fetchRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { getPlanIdForRazorpayPlanId, getPricingVariantForRazorpayPlanId } from '@/lib/razorpay/pricing';

function fromUnixSeconds(value: unknown): Date | null {
    return typeof value === 'number' && value > 0 ? new Date(value * 1000) : null;
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

function getLocalStatus(razorpayStatus: string): 'active' | 'pending' | 'halted' | 'canceled' | 'expired' {
    if (razorpayStatus === 'active' || razorpayStatus === 'authenticated') return 'active';
    if (razorpayStatus === 'created' || razorpayStatus === 'pending') return 'pending';
    if (razorpayStatus === 'halted') return 'halted';
    if (razorpayStatus === 'cancelled') return 'canceled';
    return 'expired';
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
        const razorpaySubscriptionId = subscription?.razorpaySubscriptionId as string | undefined;
        if (!razorpaySubscriptionId) {
            return NextResponse.json(
                { error: 'No Razorpay subscription found for this member.', code: 'not-found' },
                { status: 404 },
            );
        }

        const rzpSub = await fetchRazorpaySubscription(
            razorpaySubscriptionId,
            process.env.RAZORPAY_KEY_ID!,
            process.env.RAZORPAY_KEY_SECRET!,
        );

        const planId = await getPlanIdForRazorpayPlanId(rzpSub.plan_id);
        const pricingVariant = await getPricingVariantForRazorpayPlanId(rzpSub.plan_id);
        const plan = planId ? getPlanById(planId) : null;
        if (!plan) {
            return NextResponse.json(
                { error: `Razorpay plan '${rzpSub.plan_id}' is not mapped to an app plan.`, code: 'plan-not-mapped' },
                { status: 409 },
            );
        }

        const rawLocalStatus = getLocalStatus(rzpSub.status);
        const currentIntroCredit = typeof subscription?.introCreditRemaining === 'number'
            ? Math.max(0, subscription.introCreditRemaining)
            : 0;
        const currentStart = fromUnixSeconds(rzpSub.current_start) ?? fromUnixSeconds(rzpSub.start_at);
        const currentEnd = fromUnixSeconds(rzpSub.current_end) ?? fromUnixSeconds(rzpSub.charge_at);
        const localEnd = toDate(subscription?.endDate);
        const effectiveEnd = currentEnd ?? localEnd;
        const isStillUsable = !!effectiveEnd && effectiveEnd > new Date();
        const renewalCanceled = (
            subscription?.cancelAtPeriodEnd === true ||
            rzpSub.cancel_at_cycle_end === true ||
            rzpSub.status === 'cancelled'
        ) && isStillUsable;
        const localStatus = rawLocalStatus === 'canceled' && isStillUsable ? 'active' : rawLocalStatus;
        const periodAdvanced = !!currentEnd && (!localEnd || currentEnd.getTime() > localEnd.getTime() + 60 * 1000);

        await userRef.update({
            'subscription.planId': plan.id,
            'subscription.planCategory': plan.category,
            'subscription.status': localStatus,
            'subscription.startDate': currentStart ?? subscription?.startDate ?? new Date(),
            'subscription.endDate': currentEnd ?? subscription?.endDate ?? null,
            'subscription.classesRemaining': localStatus === 'active' && periodAdvanced
                ? plan.credits
                : subscription?.classesRemaining ?? plan.credits,
            'subscription.introCreditRemaining': currentIntroCredit,
            'subscription.maxClassesPerDay': plan.maxClassesPerDay,
            'subscription.weeklyClassLimit': plan.weeklyClassLimit,
            'subscription.advanceBookingDays': plan.advanceBookingDays,
            'subscription.guestPassesRemaining': localStatus === 'active' && periodAdvanced
                ? plan.guestPasses
                : subscription?.guestPassesRemaining ?? plan.guestPasses,
            'subscription.autoRenew': localStatus === 'active' && rzpSub.status !== 'completed' && !renewalCanceled,
            'subscription.cancelAtPeriodEnd': renewalCanceled,
            'subscription.razorpaySubscriptionId': rzpSub.id,
            'subscription.razorpayPlanId': rzpSub.plan_id,
            'subscription.pricingVariant': pricingVariant ?? subscription?.pricingVariant ?? 'standard',
            'subscription.pendingPlanId': rzpSub.has_scheduled_changes ? subscription?.pendingPlanId ?? null : null,
            'subscription.pendingRazorpayPlanId': rzpSub.has_scheduled_changes ? subscription?.pendingRazorpayPlanId ?? null : null,
            'subscription.pendingPlanEffectiveAt': rzpSub.has_scheduled_changes
                ? fromUnixSeconds(rzpSub.change_scheduled_at) ?? subscription?.pendingPlanEffectiveAt ?? null
                : null,
            'subscription.pendingPricingVariant': rzpSub.has_scheduled_changes ? subscription?.pendingPricingVariant ?? null : null,
            'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            planId: plan.id,
            status: localStatus,
            razorpayStatus: rzpSub.status,
            endDate: currentEnd?.toISOString() ?? null,
        });
    } catch (error) {
        console.error('[subscriptions/sync] Failed to sync subscription:', error);
        const message = error instanceof Error ? error.message : 'Failed to sync subscription';
        return NextResponse.json({ error: message, code: 'internal' }, { status: 500 });
    }
}
