import * as crypto from 'crypto';
import Razorpay from 'razorpay';

export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
}

export interface RazorpayVerifyPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export type RazorpaySubscriptionStatus =
    | 'created'
    | 'authenticated'
    | 'active'
    | 'pending'
    | 'halted'
    | 'cancelled'
    | 'completed'
    | 'expired';

export interface RazorpaySubscriptionEntity {
    id: string;
    status: RazorpaySubscriptionStatus;
    plan_id: string;
    short_url?: string;
    current_start?: number | null;
    current_end?: number | null;
    charge_at?: number | null;
    start_at?: number | null;
    ended_at?: number | null;
    total_count?: number;
    paid_count?: number;
    remaining_count?: number;
    has_scheduled_changes?: boolean;
    change_scheduled_at?: number | null;
    schedule_change_at?: 'now' | 'cycle_end';
    notes?: Record<string, string>;
}

/**
 * Verifies Razorpay payment signature.
 * Razorpay signs: HMAC_SHA256(orderId + "|" + paymentId, keySecret)
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
    keySecret: string,
): boolean {
    const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    try {
        const expectedBuf = Buffer.from(expected, 'hex');
        const sigBuf = Buffer.from(signature, 'hex');
        return expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
        return false;
    }
}

/**
 * Verifies a Razorpay webhook signature.
 * Razorpay signs the raw request body: HMAC_SHA256(rawBody, webhookSecret)
 */
export function verifyWebhookSignature(
    rawBody: string,
    signature: string,
    webhookSecret: string,
): boolean {
    const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
    try {
        const expectedBuf = Buffer.from(expected, 'hex');
        const sigBuf = Buffer.from(signature, 'hex');
        return expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
        return false;
    }
}

/**
 * Creates a Razorpay subscription for a recurring membership plan.
 */
export async function createRazorpaySubscription(
    razorpayPlanId: string,
    totalCount: number,
    keyId: string,
    keySecret: string,
    notes?: Record<string, string>,
): Promise<RazorpaySubscriptionEntity> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sub = await client.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: totalCount,
        customer_notify: 1,
        ...(notes ? { notes } : {}),
    }) as unknown as RazorpaySubscriptionEntity;
    return sub;
}

/**
 * Updates an active/authenticated Razorpay subscription to a new plan.
 * schedule_change_at='now' charges/refunds prorated differences immediately.
 * schedule_change_at='cycle_end' applies the new plan after the current cycle.
 */
export async function updateRazorpaySubscription(
    subscriptionId: string,
    razorpayPlanId: string,
    keyId: string,
    keySecret: string,
    options: {
        remainingCount?: number;
        scheduleChangeAt?: 'now' | 'cycle_end';
        customerNotify?: boolean;
    } = {},
): Promise<RazorpaySubscriptionEntity> {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            plan_id: razorpayPlanId,
            remaining_count: options.remainingCount ?? 24,
            schedule_change_at: options.scheduleChangeAt ?? 'now',
            customer_notify: options.customerNotify ?? true,
        }),
    });

    const data = await response.json() as RazorpaySubscriptionEntity & { error?: { description?: string; reason?: string } };
    if (!response.ok) {
        throw new Error(data.error?.description || data.error?.reason || 'Failed to update Razorpay subscription');
    }
    return data;
}

/**
 * Cancels a Razorpay subscription. Defaults to cancel at end of current billing cycle.
 * Pass cancelAtCycleEnd=false to cancel immediately.
 */
export async function cancelRazorpaySubscription(
    subscriptionId: string,
    keyId: string,
    keySecret: string,
    cancelAtCycleEnd = true,
): Promise<{ id: string; status: string }> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const result = await (client.subscriptions as unknown as {
        cancel: (id: string, opts: { cancel_at_cycle_end: number }) => Promise<{ id: string; status: string }>;
    }).cancel(subscriptionId, { cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 });
    return { id: result.id, status: result.status };
}

/**
 * Fetches a Razorpay subscription. Returns the subscription object including short_url.
 */
export async function fetchRazorpaySubscription(
    subscriptionId: string,
    keyId: string,
    keySecret: string,
): Promise<RazorpaySubscriptionEntity> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const result = await (client.subscriptions as unknown as {
        fetch: (id: string) => Promise<RazorpaySubscriptionEntity>;
    }).fetch(subscriptionId);
    return result;
}

/**
 * Lists all Razorpay plans. Returns plans with their item amounts (in paise) and notes.
 * Use notes.fitconnect_plan_id to match against our PlanId values.
 */
export async function listRazorpayPlans(
    keyId: string,
    keySecret: string,
): Promise<Array<{
    id: string;
    amount: number;        // in paise
    currency: string;
    name: string;
    period: string;
    interval: number;
    fitconnectPlanId?: string;
}>> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const result = await (client.plans as unknown as {
        all: (opts?: Record<string, unknown>) => Promise<{ items: Array<{
            id: string;
            interval: number;
            period: string;
            item: { amount: number; currency: string; name: string };
            notes?: Record<string, string>;
        }>; count: number }>
    }).all({ count: 100 });

    return result.items.map((plan) => ({
        id: plan.id,
        amount: plan.item.amount,
        currency: plan.item.currency,
        name: plan.item.name,
        period: plan.period,
        interval: plan.interval,
        fitconnectPlanId: plan.notes?.fitconnect_plan_id,
    }));
}

/**
 * Lists all active Razorpay Items. Items are used as a pricing catalog when the
 * Subscriptions product is not yet enabled on the account.
 * Match to our plan catalog via description field containing "fitconnect_plan_id:<planId>".
 */
export async function listRazorpayItems(
    keyId: string,
    keySecret: string,
): Promise<Array<{
    id: string;
    name: string;
    description: string;
    amount: number;    // in paise
    currency: string;
    fitconnectPlanId?: string;
}>> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const result = await (client.items as unknown as {
        all: (opts?: Record<string, unknown>) => Promise<{ items: Array<{
            id: string;
            name: string;
            description?: string;
            amount: number;
            currency: string;
            active: boolean;
        }>; count: number }>
    }).all({ count: 100 });

    return result.items
        .filter(item => item.active)
        .map(item => {
            const match = item.description?.match(/fitconnect_plan_id:(\S+)/);
            return {
                id: item.id,
                name: item.name,
                description: item.description ?? '',
                amount: item.amount,
                currency: item.currency,
                fitconnectPlanId: match?.[1],
            };
        });
}

/**
 * Creates a Razorpay order. Amount must be in INR rupees; this converts to paise internally.
 */
export async function createRazorpayOrder(
    amountRupees: number,
    planId: string,
    keyId: string,
    keySecret: string,
): Promise<RazorpayOrder> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await client.orders.create({
        amount: amountRupees * 100,
        currency: 'INR',
        receipt: planId,
    });
    return {
        id: order.id,
        amount: order.amount as number,
        currency: order.currency,
    };
}
