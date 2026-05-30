import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';

// ── Slice 1: Signature Verification ─────────────────────────────────────────
// This is pure HMAC-SHA256 — no network, no mocks.
// Razorpay signs: HMAC_SHA256(orderId + "|" + paymentId, keySecret)

describe('verifyPaymentSignature', () => {
    const KEY_SECRET = 'test_secret_key_abc123';
    const ORDER_ID = 'order_ABC123';
    const PAYMENT_ID = 'pay_XYZ789';

    function makeValidSignature(orderId: string, paymentId: string, secret: string): string {
        return crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');
    }

    let verifyPaymentSignature: (orderId: string, paymentId: string, signature: string, keySecret: string) => boolean;

    beforeEach(async () => {
        const mod = await import('../../src/payments/razorpay-processor');
        verifyPaymentSignature = mod.verifyPaymentSignature;
    });

    it('returns true for a valid HMAC-SHA256 signature', () => {
        const sig = makeValidSignature(ORDER_ID, PAYMENT_ID, KEY_SECRET);
        expect(verifyPaymentSignature(ORDER_ID, PAYMENT_ID, sig, KEY_SECRET)).toBe(true);
    });

    it('returns false for a tampered signature', () => {
        expect(verifyPaymentSignature(ORDER_ID, PAYMENT_ID, 'deadbeef', KEY_SECRET)).toBe(false);
    });

    it('returns false when orderId is wrong', () => {
        const sig = makeValidSignature('order_DIFFERENT', PAYMENT_ID, KEY_SECRET);
        expect(verifyPaymentSignature(ORDER_ID, PAYMENT_ID, sig, KEY_SECRET)).toBe(false);
    });

    it('returns false when paymentId is wrong', () => {
        const sig = makeValidSignature(ORDER_ID, 'pay_DIFFERENT', KEY_SECRET);
        expect(verifyPaymentSignature(ORDER_ID, PAYMENT_ID, sig, KEY_SECRET)).toBe(false);
    });

    it('returns false when secret is wrong', () => {
        const sig = makeValidSignature(ORDER_ID, PAYMENT_ID, 'wrong_secret');
        expect(verifyPaymentSignature(ORDER_ID, PAYMENT_ID, sig, KEY_SECRET)).toBe(false);
    });
});

// ── Slice 3: verifyWebhookSignature ──────────────────────────────────────────
// Different from payment sig: signs the raw body string with the webhook secret.

describe('verifyWebhookSignature', () => {
    const WEBHOOK_SECRET = 'webhook_secret_xyz';

    function makeWebhookSig(body: string, secret: string): string {
        return crypto.createHmac('sha256', secret).update(body).digest('hex');
    }

    let verifyWebhookSignature: (rawBody: string, signature: string, webhookSecret: string) => boolean;

    beforeEach(async () => {
        const mod = await import('../../src/payments/razorpay-processor');
        verifyWebhookSignature = mod.verifyWebhookSignature;
    });

    it('returns true for a valid webhook signature', () => {
        const body = JSON.stringify({ event: 'subscription.charged', payload: {} });
        const sig = makeWebhookSig(body, WEBHOOK_SECRET);
        expect(verifyWebhookSignature(body, sig, WEBHOOK_SECRET)).toBe(true);
    });

    it('returns false for a tampered body', () => {
        const body = JSON.stringify({ event: 'subscription.charged' });
        const sig = makeWebhookSig('different body', WEBHOOK_SECRET);
        expect(verifyWebhookSignature(body, sig, WEBHOOK_SECRET)).toBe(false);
    });

    it('returns false for wrong webhook secret', () => {
        const body = JSON.stringify({ event: 'subscription.charged' });
        const sig = makeWebhookSig(body, 'wrong_secret');
        expect(verifyWebhookSignature(body, sig, WEBHOOK_SECRET)).toBe(false);
    });
});

// ── Slice 4: createRazorpaySubscription ──────────────────────────────────────

describe('createRazorpaySubscription', () => {
    let createRazorpaySubscription: (
        razorpayPlanId: string,
        totalCount: number,
        keyId: string,
        keySecret: string,
        notes?: Record<string, string>,
    ) => Promise<{ id: string; status: string }>;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../../src/payments/razorpay-processor');
        createRazorpaySubscription = mod.createRazorpaySubscription;
    });

    it('creates a subscription with the given plan_id and total_count', async () => {
        mockSubCreate.mockResolvedValue({ id: 'sub_test_001', status: 'created' });

        await createRazorpaySubscription('plan_ABC', 24, 'rzp_test_key', 'test_secret');

        expect(mockSubCreate).toHaveBeenCalledWith(
            expect.objectContaining({ plan_id: 'plan_ABC', total_count: 24 }),
        );
    });

    it('passes customer_notify: 1 so Razorpay sends payment reminders', async () => {
        mockSubCreate.mockResolvedValue({ id: 'sub_test_002', status: 'created' });

        await createRazorpaySubscription('plan_XYZ', 12, 'rzp_test_key', 'test_secret');

        expect(mockSubCreate).toHaveBeenCalledWith(
            expect.objectContaining({ customer_notify: 1 }),
        );
    });

    it('returns id and status from Razorpay response', async () => {
        mockSubCreate.mockResolvedValue({ id: 'sub_real_abc', status: 'created' });

        const result = await createRazorpaySubscription('plan_ABC', 24, 'rzp_test_key', 'test_secret');

        expect(result.id).toBe('sub_real_abc');
        expect(result.status).toBe('created');
    });

    it('propagates Razorpay SDK errors', async () => {
        mockSubCreate.mockRejectedValue(new Error('Subscriptions not enabled'));

        await expect(
            createRazorpaySubscription('plan_ABC', 24, 'rzp_test_key', 'test_secret'),
        ).rejects.toThrow('Subscriptions not enabled');
    });
});

// ── Slice 2 & 4: shared Razorpay SDK mock ────────────────────────────────────
// Single vi.mock() covers both orders and subscriptions resources.

const { mockCreate, mockSubCreate } = vi.hoisted(() => ({
    mockCreate: vi.fn(),
    mockSubCreate: vi.fn(),
}));

vi.mock('razorpay', () => ({
    default: vi.fn().mockImplementation(() => ({
        orders: { create: mockCreate },
        subscriptions: { create: mockSubCreate },
    })),
}));

describe('createRazorpayOrder', () => {

    let createRazorpayOrder: (amount: number, planId: string, keyId: string, keySecret: string) => Promise<{ id: string; amount: number; currency: string }>;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../../src/payments/razorpay-processor');
        createRazorpayOrder = mod.createRazorpayOrder;
    });

    it('sends amount in paise (rupees × 100) to Razorpay', async () => {
        mockCreate.mockResolvedValue({ id: 'order_test_1', amount: 5000_00, currency: 'INR', status: 'created' });

        await createRazorpayOrder(5000, 'kickstarter', 'rzp_test_key', 'test_secret');

        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 500000, currency: 'INR' }),
        );
    });

    it('includes receipt (planId) in the order', async () => {
        mockCreate.mockResolvedValue({ id: 'order_test_2', amount: 3600000, currency: 'INR', status: 'created' });

        await createRazorpayOrder(36000, 'twice_quarterly', 'rzp_test_key', 'test_secret');

        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({ receipt: 'twice_quarterly' }),
        );
    });

    it('returns order id, amount, and currency from Razorpay response', async () => {
        mockCreate.mockResolvedValue({ id: 'order_real_abc', amount: 9600000, currency: 'INR', status: 'created' });

        const result = await createRazorpayOrder(96000, 'thrice_6mo', 'rzp_test_key', 'test_secret');

        expect(result.id).toBe('order_real_abc');
        expect(result.amount).toBe(9600000);
        expect(result.currency).toBe('INR');
    });

    it('propagates Razorpay SDK errors', async () => {
        mockCreate.mockRejectedValue(new Error('Razorpay API unreachable'));

        await expect(
            createRazorpayOrder(5000, 'kickstarter', 'rzp_test_key', 'test_secret'),
        ).rejects.toThrow('Razorpay API unreachable');
    });
});
