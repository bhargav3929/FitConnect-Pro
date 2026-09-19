import { cancelRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { addDays } from '@fitconnect/shared/subscriptions/policy';

/**
 * Helpers shared by every path that turns a Razorpay billing period into the
 * member's access window (webhook, sync, plan change).
 */

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Frozen days carried on top of Razorpay's period. They belong to one Razorpay
 * subscription; a brand-new subscription starts with none.
 */
export function accessOffsetDaysFor(
    currentSub: Record<string, unknown> | undefined,
    razorpaySubscriptionId: string,
): number {
    if (!currentSub || currentSub.razorpaySubscriptionId !== razorpaySubscriptionId) return 0;
    const offset = currentSub.accessOffsetDays;
    return typeof offset === 'number' && offset > 0 ? offset : 0;
}

/** Razorpay's period end plus any frozen days the member is owed. */
export function accessEndDate(
    razorpayPeriodEnd: Date,
    currentSub: Record<string, unknown> | undefined,
    razorpaySubscriptionId: string,
): Date {
    return addDays(razorpayPeriodEnd, accessOffsetDaysFor(currentSub, razorpaySubscriptionId));
}

/**
 * A member who cancelled inside the notice window owes one more cycle. Once a
 * cycle that started after their request has been charged, renewal must stop.
 */
export function isDeferredCancelDue(
    currentSub: Record<string, unknown> | undefined,
    razorpaySubscriptionId: string,
    cycleStart: Date | null,
): boolean {
    if (!currentSub || currentSub.cancelAfterNextCharge !== true) return false;
    if (currentSub.razorpaySubscriptionId !== razorpaySubscriptionId) return false;
    const requestedAt = toDate(currentSub.cancelRequestedAt);
    if (!requestedAt || !cycleStart) return false;
    return cycleStart.getTime() > requestedAt.getTime();
}

/** Stops renewal at the end of the current (just charged) cycle. Returns false on failure. */
export async function cancelRenewalAtCycleEnd(razorpaySubscriptionId: string): Promise<boolean> {
    try {
        await cancelRazorpaySubscription(
            razorpaySubscriptionId,
            process.env.RAZORPAY_KEY_ID!,
            process.env.RAZORPAY_KEY_SECRET!,
            true,
        );
        return true;
    } catch (error) {
        console.error('[billing] deferred cancel failed for', razorpaySubscriptionId, error);
        return false;
    }
}

/**
 * Freeze and cancellation state that belongs to one plan purchase. Spread into
 * every write that grants a brand-new plan so nothing leaks from the old one.
 * lastFreezeRequestedAt is kept on purpose: the yearly freeze limit spans plans.
 */
export const FRESH_PLAN_POLICY_STATE = {
    'subscription.freezeStartDate': null,
    'subscription.freezeEndDate': null,
    'subscription.freezeDays': 0,
    'subscription.accessOffsetDays': 0,
    'subscription.cancelAfterNextCharge': false,
    'subscription.cancelRequestedAt': null,
} as const;
