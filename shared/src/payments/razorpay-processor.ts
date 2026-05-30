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
): Promise<{ id: string; status: string }> {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sub = await client.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: totalCount,
        customer_notify: 1,
        ...(notes ? { notes } : {}),
    });
    return { id: sub.id, status: sub.status };
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
